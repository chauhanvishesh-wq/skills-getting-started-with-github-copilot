from openpyxl import Workbook
from fastapi.testclient import TestClient

from src.app import app, activities, load_activities_from_excel


def test_load_activities_from_excel(tmp_path):
    workbook = Workbook()
    sheet = workbook.active
    sheet.append(["name", "description", "schedule", "max_participants", "participants"])
    sheet.append(["Robotics Club", "Build robots", "Wednesday, 4:00 PM", 10, "a@school.edu, b@school.edu"])

    excel_file = tmp_path / "activities.xlsx"
    workbook.save(excel_file)

    loaded = load_activities_from_excel(excel_file)

    assert loaded["Robotics Club"]["max_participants"] == 10
    assert loaded["Robotics Club"]["participants"] == ["a@school.edu", "b@school.edu"]


def test_dashboard_endpoint_totals():
    client = TestClient(app)
    expected_total_participants = sum(len(activity["participants"]) for activity in activities.values())
    expected_total_capacity = sum(activity["max_participants"] for activity in activities.values())

    response = client.get("/dashboard")

    assert response.status_code == 200
    assert response.json() == {
        "total_activities": len(activities),
        "total_participants": expected_total_participants,
        "total_capacity": expected_total_capacity,
        "available_spots": expected_total_capacity - expected_total_participants,
    }
