"""Tests for Task CRUD operations (US1-US4).

Tests cover:
- Create task with valid data
- Create task with missing title
- List tasks (only user's own)
- Get single task
- Update task (partial and full)
- Delete task
- User isolation (cannot access other user's tasks)
"""

import pytest
from httpx import AsyncClient
from uuid import uuid4

from tests.conftest import create_test_token


class TestCreateTask:
    """Test task creation endpoint (US1)."""

    @pytest.mark.asyncio
    async def test_create_task_with_title_only(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US1.AC1: Create task with title returns 201 and task data."""
        task_data = {"title": "Test Task"}
        response = await client.post(
            "/api/v1/tasks", json=task_data, headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Task"
        assert data["description"] is None
        assert data["completed"] is False
        assert "id" in data
        assert "user_id" in data
        assert "created_at" in data
        assert "updated_at" in data

    @pytest.mark.asyncio
    async def test_create_task_with_description(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US1.AC1: Create task with title and description."""
        task_data = {"title": "Test Task", "description": "A test description"}
        response = await client.post(
            "/api/v1/tasks", json=task_data, headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Task"
        assert data["description"] == "A test description"

    @pytest.mark.asyncio
    async def test_create_task_without_title_returns_422(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US1.AC2: Create task without title returns validation error."""
        task_data = {"description": "No title provided"}
        response = await client.post(
            "/api/v1/tasks", json=task_data, headers=auth_headers
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_task_with_empty_title_returns_422(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US1.AC2: Create task with empty title returns validation error."""
        task_data = {"title": ""}
        response = await client.post(
            "/api/v1/tasks", json=task_data, headers=auth_headers
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_task_without_auth_returns_401(self, client: AsyncClient):
        """US1.AC3: Create task without auth returns 401/403."""
        task_data = {"title": "Test Task"}
        response = await client.post("/api/v1/tasks", json=task_data)

        assert response.status_code in [401, 403]


class TestListTasks:
    """Test task listing endpoint (US2)."""

    @pytest.mark.asyncio
    async def test_list_tasks_returns_user_tasks(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US2.AC1: List tasks returns only authenticated user's tasks."""
        # Create a task first
        task_data = {"title": "My Task"}
        await client.post("/api/v1/tasks", json=task_data, headers=auth_headers)

        # List tasks
        response = await client.get("/api/v1/tasks", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["title"] == "My Task"

    @pytest.mark.asyncio
    async def test_list_tasks_empty_for_new_user(self, client: AsyncClient):
        """US2.AC2: New user with no tasks gets empty list."""
        new_user_token = create_test_token(user_id=str(uuid4()))
        headers = {"Authorization": f"Bearer {new_user_token}"}

        response = await client.get("/api/v1/tasks", headers=headers)

        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_list_tasks_without_auth_returns_401(self, client: AsyncClient):
        """US2: List tasks without auth returns 401/403."""
        response = await client.get("/api/v1/tasks")
        assert response.status_code in [401, 403]


class TestGetTask:
    """Test get single task endpoint (US2)."""

    @pytest.mark.asyncio
    async def test_get_task_returns_task(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US2.AC3: Get task by ID returns task with all properties."""
        # Create a task
        task_data = {"title": "Get Me", "description": "Test description"}
        create_response = await client.post(
            "/api/v1/tasks", json=task_data, headers=auth_headers
        )
        task_id = create_response.json()["id"]

        # Get the task
        response = await client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == task_id
        assert data["title"] == "Get Me"
        assert data["description"] == "Test description"

    @pytest.mark.asyncio
    async def test_get_nonexistent_task_returns_404(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US2: Get non-existent task returns 404."""
        fake_id = str(uuid4())
        response = await client.get(f"/api/v1/tasks/{fake_id}", headers=auth_headers)

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_get_other_users_task_returns_404(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US2: Accessing another user's task returns 404 (not 403)."""
        # Create task as first user
        task_data = {"title": "Private Task"}
        create_response = await client.post(
            "/api/v1/tasks", json=task_data, headers=auth_headers
        )
        task_id = create_response.json()["id"]

        # Try to access as different user
        other_token = create_test_token(user_id=str(uuid4()))
        other_headers = {"Authorization": f"Bearer {other_token}"}

        response = await client.get(f"/api/v1/tasks/{task_id}", headers=other_headers)

        assert response.status_code == 404  # Not 403, to prevent info leakage


class TestUpdateTask:
    """Test task update endpoints (US3)."""

    @pytest.mark.asyncio
    async def test_update_task_title(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US3.AC1: Update task title."""
        # Create a task
        task_data = {"title": "Original Title"}
        create_response = await client.post(
            "/api/v1/tasks", json=task_data, headers=auth_headers
        )
        task_id = create_response.json()["id"]

        # Update title
        update_data = {"title": "Updated Title"}
        response = await client.patch(
            f"/api/v1/tasks/{task_id}", json=update_data, headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"

    @pytest.mark.asyncio
    async def test_update_task_completed_status(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US3.AC2: Mark task as complete."""
        # Create a task
        task_data = {"title": "Complete Me"}
        create_response = await client.post(
            "/api/v1/tasks", json=task_data, headers=auth_headers
        )
        task_id = create_response.json()["id"]
        assert create_response.json()["completed"] is False

        # Mark complete
        update_data = {"completed": True}
        response = await client.patch(
            f"/api/v1/tasks/{task_id}", json=update_data, headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json()["completed"] is True

    @pytest.mark.asyncio
    async def test_update_other_users_task_returns_404(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US3.AC3: Update another user's task returns 404."""
        # Create task as first user
        task_data = {"title": "Not Yours"}
        create_response = await client.post(
            "/api/v1/tasks", json=task_data, headers=auth_headers
        )
        task_id = create_response.json()["id"]

        # Try to update as different user
        other_token = create_test_token(user_id=str(uuid4()))
        other_headers = {"Authorization": f"Bearer {other_token}"}

        update_data = {"title": "Hacked"}
        response = await client.patch(
            f"/api/v1/tasks/{task_id}", json=update_data, headers=other_headers
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_nonexistent_task_returns_404(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US3.AC4: Update non-existent task returns 404."""
        fake_id = str(uuid4())
        update_data = {"title": "Ghost Task"}
        response = await client.patch(
            f"/api/v1/tasks/{fake_id}", json=update_data, headers=auth_headers
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_full_update_with_put(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US3: PUT replaces all task fields."""
        # Create a task
        task_data = {"title": "Original", "description": "Original desc"}
        create_response = await client.post(
            "/api/v1/tasks", json=task_data, headers=auth_headers
        )
        task_id = create_response.json()["id"]

        # Full update
        update_data = {"title": "New Title", "description": "New desc", "completed": True}
        response = await client.put(
            f"/api/v1/tasks/{task_id}", json=update_data, headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "New Title"
        assert data["description"] == "New desc"
        assert data["completed"] is True


class TestDeleteTask:
    """Test task deletion endpoint (US4)."""

    @pytest.mark.asyncio
    async def test_delete_task_returns_204(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US4.AC1: Delete owned task returns 204 No Content."""
        # Create a task
        task_data = {"title": "Delete Me"}
        create_response = await client.post(
            "/api/v1/tasks", json=task_data, headers=auth_headers
        )
        task_id = create_response.json()["id"]

        # Delete it
        response = await client.delete(
            f"/api/v1/tasks/{task_id}", headers=auth_headers
        )

        assert response.status_code == 204

        # Verify it's gone
        get_response = await client.get(
            f"/api/v1/tasks/{task_id}", headers=auth_headers
        )
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_other_users_task_returns_404(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US4.AC2: Delete another user's task returns 404."""
        # Create task as first user
        task_data = {"title": "Protected Task"}
        create_response = await client.post(
            "/api/v1/tasks", json=task_data, headers=auth_headers
        )
        task_id = create_response.json()["id"]

        # Try to delete as different user
        other_token = create_test_token(user_id=str(uuid4()))
        other_headers = {"Authorization": f"Bearer {other_token}"}

        response = await client.delete(
            f"/api/v1/tasks/{task_id}", headers=other_headers
        )

        assert response.status_code == 404

        # Verify it still exists for original user
        get_response = await client.get(
            f"/api/v1/tasks/{task_id}", headers=auth_headers
        )
        assert get_response.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_nonexistent_task_returns_404(
        self, client: AsyncClient, auth_headers: dict
    ):
        """US4.AC3: Delete non-existent task returns 404."""
        fake_id = str(uuid4())
        response = await client.delete(
            f"/api/v1/tasks/{fake_id}", headers=auth_headers
        )

        assert response.status_code == 404


class TestUserIsolation:
    """Test user data isolation (Constitution Principle III)."""

    @pytest.mark.asyncio
    async def test_users_cannot_see_each_others_tasks(self, client: AsyncClient):
        """Users can only see their own tasks."""
        # User 1 creates a task
        user1_token = create_test_token(user_id="user-1")
        user1_headers = {"Authorization": f"Bearer {user1_token}"}
        await client.post(
            "/api/v1/tasks",
            json={"title": "User 1 Task"},
            headers=user1_headers,
        )

        # User 2 creates a task
        user2_token = create_test_token(user_id="user-2")
        user2_headers = {"Authorization": f"Bearer {user2_token}"}
        await client.post(
            "/api/v1/tasks",
            json={"title": "User 2 Task"},
            headers=user2_headers,
        )

        # User 1 only sees their tasks
        response1 = await client.get("/api/v1/tasks", headers=user1_headers)
        tasks1 = response1.json()
        for task in tasks1:
            assert task["user_id"] == "user-1"

        # User 2 only sees their tasks
        response2 = await client.get("/api/v1/tasks", headers=user2_headers)
        tasks2 = response2.json()
        for task in tasks2:
            assert task["user_id"] == "user-2"
