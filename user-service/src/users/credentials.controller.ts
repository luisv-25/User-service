import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { CredentialsService } from "./credentials.service";
import { CreateCredentialDto } from "./dto/create-credential.dto";
import { VerifyCredentialDto } from "./dto/verify-credential.dto";
import { JwtRolesGuard } from "../common/jwt-roles.guard";
import { Roles } from "../common/roles.decorator";

@Controller()
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  // Un tutor sube SU PROPIA credencial; un admin puede subirla en su
  // nombre (por ejemplo, si llegó el documento por otro medio).
  @Post("users/:id/credentials")
  @UseGuards(JwtRolesGuard)
  @Roles("tutor", "admin")
  create(@Param("id") id: string, @Body() dto: CreateCredentialDto, @Req() req: any) {
    this.assertSelfOrAdmin(id, req.user);
    return this.credentialsService.create(id, dto);
  }

  @Get("users/:id/credentials")
  @UseGuards(JwtRolesGuard)
  @Roles("tutor", "admin")
  findForTutor(@Param("id") id: string, @Req() req: any) {
    this.assertSelfOrAdmin(id, req.user);
    return this.credentialsService.findForTutor(id);
  }

  // Cola de revisión del admin (documento primario: "flujo de aprobación
  // manual antes de su publicación en el catálogo").
  @Get("credentials/pending")
  @UseGuards(JwtRolesGuard)
  @Roles("admin")
  findPending() {
    return this.credentialsService.findPending();
  }

  @Patch("credentials/:credentialId/verify")
  @UseGuards(JwtRolesGuard)
  @Roles("admin")
  verify(@Param("credentialId") credentialId: string, @Body() dto: VerifyCredentialDto, @Req() req: any) {
    return this.credentialsService.verify(credentialId, dto.status, req.user.id);
  }

  private assertSelfOrAdmin(targetUserId: string, requester: { id: string; role: string }) {
    if (requester.role === "admin") return;
    if (requester.id !== targetUserId) {
      throw new ForbiddenException("Solo puedes gestionar tus propias credenciales");
    }
  }
}
