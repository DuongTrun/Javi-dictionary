# Build stage
FROM maven:3.8.8-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Tối ưu JVM cho RAM 512MB
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-Xmx380m", "-jar", "app.jar"]
