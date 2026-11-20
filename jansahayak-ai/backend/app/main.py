import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

load_dotenv()

# Register model metadata before creating tables.
from app.models import ai_assessment, complaint, department, incident, status_history  # noqa: F401, E402

Base.metadata.create_all(bind=engine)

# Lightweight SQLite compatibility for databases created before officer remarks existed.
if str(engine.url).startswith("sqlite"):
    with engine.begin() as connection:
        columns = connection.exec_driver_sql("PRAGMA table_info(status_history)").all()
        if columns and not any(row[1] == "remarks" for row in columns):
            connection.exec_driver_sql("ALTER TABLE status_history ADD COLUMN remarks TEXT")

# Lightweight SQLite compatibility for existing Phase 1/2 databases.
if str(engine.url).startswith("sqlite"):
    with engine.begin() as connection:
        columns = connection.exec_driver_sql("PRAGMA table_info(status_history)").all()
        if columns and not any(row[1] == "remarks" for row in columns):
            connection.exec_driver_sql("ALTER TABLE status_history ADD COLUMN remarks TEXT")

        assessment_columns = connection.exec_driver_sql("PRAGMA table_info(ai_assessments)").all()
        assessment_names = {row[1] for row in assessment_columns}
        assessment_migrations = {
            "recommended_department": "VARCHAR(100)",
            "department_reason": "TEXT",
            "department_evidence": "JSON",
            "department_rule": "VARCHAR(200)",
            "recommended_priority": "VARCHAR(20) DEFAULT 'Medium'",
            "priority_reason": "TEXT",
            "priority_evidence": "JSON",
            "priority_rules": "JSON",
            "final_department_id": "INTEGER",
            "final_priority": "VARCHAR(20)",
            "human_decision_reason": "TEXT",
        }
        if assessment_columns:
            for column_name, column_type in assessment_migrations.items():
                if column_name not in assessment_names:
                    connection.exec_driver_sql(
                        f"ALTER TABLE ai_assessments ADD COLUMN {column_name} {column_type}"
                    )

# Lightweight SQLite compatibility for the expanded incident model.
if str(engine.url).startswith("sqlite"):
    with engine.begin() as connection:
        incident_columns = connection.exec_driver_sql("PRAGMA table_info(incidents)").all()
        incident_names = {row[1] for row in incident_columns}
        incident_migrations = {
            "title": "VARCHAR(200) DEFAULT 'Proposed Incident'",
            "district": "VARCHAR(100)",
            "locality": "VARCHAR(200)",
        }
        if incident_columns:
            for column_name, column_type in incident_migrations.items():
                if column_name not in incident_names:
                    connection.exec_driver_sql(
                        f"ALTER TABLE incidents ADD COLUMN {column_name} {column_type}"
                    )

            if "complaint_id" in incident_names:
                connection.exec_driver_sql("ALTER TABLE incidents RENAME TO incidents_legacy")
                connection.exec_driver_sql("""
                    CREATE TABLE incidents (
                        id INTEGER PRIMARY KEY,
                        title VARCHAR(200) NOT NULL DEFAULT 'Proposed Incident',
                        district VARCHAR(100),
                        locality VARCHAR(200),
                        department_id INTEGER REFERENCES departments(id),
                        severity VARCHAR(20) NOT NULL DEFAULT 'Medium',
                        notes TEXT,
                        created_at DATETIME NOT NULL
                    )
                """)
                connection.exec_driver_sql("""
                    INSERT INTO incidents (id, title, district, locality, department_id, severity, notes, created_at)
                    SELECT id, 'Proposed Incident', NULL, NULL, department_id, severity, notes, created_at
                    FROM incidents_legacy
                """)
                connection.exec_driver_sql("DROP TABLE incidents_legacy")

# Add useful starter departments; existing records are never duplicated.
from app.database import SessionLocal  # noqa: E402
from app.models.department import Department  # noqa: E402

starter_departments = [
    ("Public Works", "Roads, drainage, and public infrastructure"),
    ("Health", "Public health and medical services"),
    ("Education", "Schools and educational administration"),
    ("Transport", "Road transport and public transit"),
    ("Sanitation", "Waste collection and cleanliness"),
    ("Revenue", "Land records and revenue administration"),
]

with SessionLocal() as startup_db:
    for name, description in starter_departments:
        if startup_db.query(Department).filter(Department.name == name).first() is None:
            startup_db.add(Department(name=name, description=description))
    startup_db.commit()

app = FastAPI(title=os.getenv("APP_NAME", "JanSahayak AI"))

cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers.complaints import router as complaints_router  # noqa: E402
from app.routers.departments import router as departments_router  # noqa: E402
from app.routers.dashboard import router as dashboard_router  # noqa: E402
from app.routers.incidents import router as incidents_router  # noqa: E402

app.include_router(complaints_router)
app.include_router(departments_router)
app.include_router(dashboard_router)
app.include_router(incidents_router)


@app.get("/api/health")
async def health_check():
    return {
        "status": "success",
        "message": "JanSahayak AI Backend Running",
    }
