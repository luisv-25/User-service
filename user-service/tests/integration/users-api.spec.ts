import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { EventsPublisher } from "../../src/events/events.publisher";
import { createTestApp, fakeEventsPublisher, tokenFor } from "../helpers/test-app";

// Prueba de INTEGRACIÓN: endpoint HTTP -> controlador -> servicio -> PostgreSQL real.
// Solo RabbitMQ se reemplaza (publicador falso) para no depender de un broker.
describe("Integración: registro, login, consulta y eliminación de usuarios", () => {
  let app: INestApplication;
  const events = fakeEventsPublisher();

  beforeAll(async () => {
    app = await createTestApp([AppModule], [{ provide: EventsPublisher, useValue: events }]);
  });

  afterAll(async () => {
    await app.close();
  });

  it("registra un estudiante, inicia sesión, lo consulta y el admin lo elimina (queda en la base de datos)", async () => {
    const http = request(app.getHttpServer());

    // CREAR: el usuario queda guardado en PostgreSQL y se publica user.created
    const created = await http
      .post("/api/v1/auth/register")
      .send({ email: "estudiante@educonecta.test", password: "clave12345", role: "student", fullName: "Estudiante Prueba" })
      .expect(201);
    expect(created.body.email).toBe("estudiante@educonecta.test");
    expect(created.body.password_hash).toBeUndefined(); // el hash nunca sale en la API
    expect(events.calls.map((c: any) => c.event)).toContain("publishUserCreated");

    // Validación: correo duplicado -> 409
    await http
      .post("/api/v1/auth/register")
      .send({ email: "estudiante@educonecta.test", password: "clave12345", role: "student" })
      .expect(409);

    // LOGIN: credenciales correctas -> tokens; incorrectas -> 401
    const login = await http.post("/api/v1/auth/login").send({ email: "estudiante@educonecta.test", password: "clave12345" }).expect(201);
    expect(login.body.accessToken).toBeDefined();
    await http.post("/api/v1/auth/login").send({ email: "estudiante@educonecta.test", password: "equivocada" }).expect(401);

    // CONSULTAR: perfil por id y listado filtrado por rol
    const id = created.body.id;
    await http.get(`/api/v1/users/${id}`).expect(200);
    const students = await http.get("/api/v1/users?role=student").expect(200);
    expect(students.body.some((u: any) => u.id === id)).toBe(true);

    // ELIMINAR: solo un admin (RBAC); un estudiante recibe 403
    await http.delete(`/api/v1/users/${id}`).set("Authorization", `Bearer ${tokenFor(id, "student")}`).expect(403);
    await http.delete(`/api/v1/users/${id}`).set("Authorization", `Bearer ${tokenFor("admin-1", "admin")}`).expect(200);
    await http.get(`/api/v1/users/${id}`).expect(404);
  });
});
