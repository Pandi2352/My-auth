import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
        .setTitle(process.env.SWAGGER_TITLE || "NestJS API")
        .setDescription(process.env.SWAGGER_DESCRIPTION || "API Documentation")
        .setVersion(process.env.SWAGGER_VERSION || "1.0.0")
        .addBearerAuth(
            {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                name: "Authorization",
                description: "Enter JWT token",
                in: "header",
            },
            "access-token",
        )
        .addServer(process.env.SWAGGER_SERVER_URL || "/", "Default Server")
        .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup(
        process.env.SWAGGER_PATH || "api-docs",
        app,
        document,
        {
            swaggerOptions: {
                persistAuthorization: true,
            },
        },
    );
}
