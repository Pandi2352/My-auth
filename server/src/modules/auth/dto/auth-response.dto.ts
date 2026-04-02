import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT Access Token' })
    access_token: string;

    @ApiProperty({ example: 'def7a9b...', description: 'JWT Refresh Token' })
    refresh_token: string;

    @ApiProperty({ example: 900, description: 'Expires in seconds' })
    expires_in: number;
}

export class UserPayloadDto {
    @ApiProperty({ example: '65e7... ', description: 'User ID' })
    _id: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    email: string;

    @ApiProperty({ example: ['admin'] })
    roles: string[];
}

export class LoginResponseDto extends AuthResponseDto {
    @ApiProperty({ type: UserPayloadDto })
    user: UserPayloadDto;
}

export class RegisterResponseDto {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'Verification email sent to john.doe@example.com' })
    message: string;
}
