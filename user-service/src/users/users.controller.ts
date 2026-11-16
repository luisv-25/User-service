import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { SetAvailabilityDto } from "./dto/set-availability.dto";
import { UserRole, TutorVerificationStatus } from "./entities/user.entity";
import { JwtRolesGuard } from "../common/jwt-roles.guard";
import { Roles } from "../common/roles.decorator";
import {ForbiddenException, Req } from "@nestjs/common";
import { UpdateUserDto } from "./dto/update-user.dto";


@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  
  @Patch(":id")
  @UseGuards(JwtRolesGuard)
  async updateUser(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: any,
  ) {
    const currentUser = req.user;
  
    if (
      currentUser.id !== id &&
      currentUser.role !== "admin"
    ) {
      throw new ForbiddenException(
        "No tienes permiso para modificar este usuario",
      );
    }
  
    return this.usersService.updateUser(
      id,
      dto.fullName,
    );
  }


  // Directorio para las pestañas "Tutores"/"Estudiantes" del frontend;
  // ?verificationStatus= es para la cola de revisión del admin.
  @Get()
  findAll(
    @Query("role") role?: UserRole,
    @Query("verificationStatus") verificationStatus?: TutorVerificationStatus,
  ) {
    return this.usersService.findAll(role, verificationStatus);
  }

  // Este es el endpoint que Catalog Service llama de forma SÍNCRONA
  // para completar el perfil del tutor (ver 4.2 del documento de arquitectura).
  @Get(":id")
  async getById(@Param("id") id: string) {
    const user = await this.usersService.findById(id);
    return this.usersService.toPublicProfile(user);
  }

  // Permiso de admin: eliminar cuentas de tutores/estudiantes inactivos.
  @Delete(":id")
  @UseGuards(JwtRolesGuard)
  @Roles("admin")
  deleteAccount(@Param("id") id: string) {
    return this.usersService.deleteUser(id);
  }

  @Get(":id/availability")
  getAvailability(@Param("id") id: string) {
    return this.usersService.getAvailability(id);
  }

  @Patch(":id/availability")
  setAvailability(@Param("id") id: string, @Body() dto: SetAvailabilityDto) {
    return this.usersService.setAvailability(id, dto.slots);
  }
}
