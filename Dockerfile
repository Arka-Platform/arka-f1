# Stage 1: build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Stage 2: build backend
FROM maven:3.9.6-eclipse-temurin-21 AS backend-build
WORKDIR /app
COPY arka-backend/pom.xml ./arka-backend/pom.xml
RUN mvn -f arka-backend/pom.xml dependency:go-offline
COPY arka-backend/ ./arka-backend/
COPY --from=frontend-build /app/frontend/dist ./arka-backend/src/main/resources/static
RUN mvn -f arka-backend/pom.xml clean package -DskipTests

# Stage 3: runtime image
FROM gcr.io/distroless/java21-debian12
WORKDIR /app
COPY --from=backend-build /app/arka-backend/target/arka-backend-*.jar app.jar
EXPOSE 8080
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0"
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
