const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  // --- LOGIN / REGISTER ---

  if (document.getElementById('btn-login')) {
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const btnLogin = document.getElementById('btn-login');
    const loginError = document.getElementById('login-error');

    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const btnRegister = document.getElementById('btn-register');
    const registerUsername = document.getElementById('register-username');
    const registerPassword = document.getElementById('register-password');
    const registerError = document.getElementById('register-error');

    document.getElementById('show-register').addEventListener('click', e => {
      e.preventDefault();
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      loginError.textContent = '';
    });

    document.getElementById('show-login').addEventListener('click', e => {
      e.preventDefault();
      registerForm.style.display = 'none';
      loginForm.style.display = 'block';
      registerError.textContent = '';
    });

    btnLogin.addEventListener('click', async () => {
      loginError.textContent = '';
      const username = loginUsername.value.trim();
      const password = loginPassword.value.trim();
      if (!username || !password) {
        loginError.textContent = 'Please fill in all fields.';
        return;
      }

      try {
        const res = await fetch(`${API_URL}/users/login`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (!res.ok) {
          loginError.textContent = data.message || 'Login failed.';
          return;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('username', username);
        window.location.href = 'notes.html';

      } catch (err) {
        loginError.textContent = 'Network error.';
      }
    });

    btnRegister.addEventListener('click', async () => {
      registerError.textContent = '';
      const username = registerUsername.value.trim();
      const password = registerPassword.value.trim();
      if (!username || !password) {
        registerError.textContent = 'Please fill in all fields.';
        return;
      }

      try {
        const res = await fetch(`${API_URL}/users/register`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (!res.ok) {
          registerError.textContent = data.message || 'Registration failed.';
          return;
        }

        alert('Registration successful! You can now log in.');
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
      } catch (err) {
        registerError.textContent = 'Network error.';
      }
    });
  }

  // --- NOTES MANAGEMENT (notes.html) ---

  if (document.getElementById('note-form')) {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'index.html';
      return;
    }

    const notesList = document.getElementById('notes-list');
    const searchInput = document.getElementById('search');
    const noteForm = document.getElementById('note-form');
    const noteTitle = document.getElementById('note-title');
    const noteContent = document.getElementById('note-content');
    const formTitle = document.getElementById('form-title');
    const btnCancel = document.getElementById('btn-cancel');
    const notesError = document.getElementById('notes-error');
    const btnLogout = document.getElementById('btn-logout');

    let notes = [];
    let editingNoteId = null;

    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = 'index.html';
    });

    async function loadNotes() {
      notesError.textContent = '';
      try {
        const res = await fetch(`${API_URL}/notes`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.location.href = 'index.html';
          return;
        }

        if (!res.ok) throw new Error('Failed to load notes.');
        notes = await res.json();
        displayNotes(notes.slice().reverse());
      } catch (err) {
        notesError.textContent = err.message;
      }
    }

    function displayNotes(notesToShow) {
      notesList.innerHTML = '';
      if (notesToShow.length === 0) {
        notesList.innerHTML = '<p>No notes found.</p>';
        return;
      }

      notesToShow.forEach(note => {
        const div = document.createElement('div');
        div.classList.add('note-item');
        div.innerHTML = `
          <h3>${escapeHtml(note.title)}</h3>
          <p>${escapeHtml(note.content)}</p>
          <button class="btn-view" data-id="${note._id}">View / Edit</button>
          <button class="btn-delete" data-id="${note._id}">Delete</button>
        `;
        notesList.appendChild(div);
      });
    }

    notesList.addEventListener('click', e => {
      if (e.target.classList.contains('btn-view')) {
        const id = e.target.dataset.id;
        startEditing(id);
      } else if (e.target.classList.contains('btn-delete')) {
        const id = e.target.dataset.id;
        deleteNote(id);
      }
    });

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    searchInput.addEventListener('input', () => {
      const filtered = notes.filter(note =>
        note.title.toLowerCase().includes(searchInput.value.toLowerCase()) ||
        note.content.toLowerCase().includes(searchInput.value.toLowerCase())
      );
      displayNotes(filtered);
    });

    function startEditing(id) {
      const note = notes.find(n => n._id === id);
      if (!note) return;
      editingNoteId = id;
      formTitle.textContent = 'Edit Note';
      noteTitle.value = note.title;
      noteContent.value = note.content;
      btnCancel.style.display = 'inline';
    }

    btnCancel.addEventListener('click', () => {
      editingNoteId = null;
      formTitle.textContent = 'Create New Note';
      noteTitle.value = '';
      noteContent.value = '';
      btnCancel.style.display = 'none';
      notesError.textContent = '';
    });

    async function deleteNote(id) {
      if (!confirm('Are you sure you want to delete this note?')) return;
      try {
        const res = await fetch(`${API_URL}/notes/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to delete note.');
        notes = notes.filter(n => n._id !== id);
        displayNotes(notes.slice().reverse());
      } catch (err) {
        notesError.textContent = err.message;
      }
    }

    noteForm.addEventListener('submit', async e => {
      e.preventDefault();
      notesError.textContent = '';

      const title = noteTitle.value.trim();
      const content = noteContent.value.trim();

      if (!title || !content) {
        notesError.textContent = 'Please fill in all fields.';
        return;
      }

      try {
        let res;
        if (editingNoteId) {
          res = await fetch(`${API_URL}/notes/${editingNoteId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ title, content })
          });
        } else {
          res = await fetch(`${API_URL}/notes`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ title, content })
          });
        }

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to save note.');
        }

        await loadNotes();
        editingNoteId = null;
        formTitle.textContent = 'Create New Note';
        noteTitle.value = '';
        noteContent.value = '';
        btnCancel.style.display = 'none';

      } catch (err) {
        notesError.textContent = err.message;
      }
    });

    loadNotes();
  }
});
