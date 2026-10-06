import { IsEnum, IsString, MinLength } from "class-validator";
import { CredentialType } from "../entities/tutor-credential.entity";

export class CreateCredentialDto {
  @IsEnum(CredentialType)
  documentType: CredentialType;

  // URL del documento ya subido (a donde sea que lo suban — un bucket,
  // Google Drive, etc.); este servicio no maneja el upload del archivo en
  // sí, solo la referencia y el flujo de aprobación.
  @IsString()
  @MinLength(5)
  documentUrl: string;
}
