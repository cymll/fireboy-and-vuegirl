<!--
  CHECKPOINT 6 — Lifecycle hooks (onMounted)
  New: onMounted() to load saved data and focus the input once the page is on screen.

  Functions in this checkpoint: addTodo, toggleTodo, removeTodo, clearDone
  (same four; each one now also saves the list to localStorage as its last line)
-->
<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc,
         writeBatch, serverTimestamp } from 'firebase/firestore'
import { db, todosCol, auth, model} from './firebase'
import LoginForm from './components/LoginForm.vue'
import TodoItem from './components/TodoItem.vue'
import TodoFilters from './components/TodoFilters.vue'



const user = ref(null)          // the real Firebase user, or null
const authReady = ref(false)    // false until Firebase knows whether you're signed in



const title = ref('My Todo List')


// Start EMPTY. The data arrives in onMounted, just like data from a server will.
const todos = ref([])

const showTips = ref(false)

const newText = ref('')
const newNote = ref('')
const newImportant = ref(false)

// A "template ref": Vue puts the real <input> element in here after mounting
const inputEl = ref(null)

const filter = ref('all')
const summary = ref('')
const summarizing = ref(false)
const summaryError = ref('')

const remaining = computed(() => todos.value.filter((t) => !t.done).length)
const doneCount = computed(() => todos.value.length - remaining.value)
const canAdd = computed(() => newText.value.trim().length > 0)

const visibleTodos = computed(() => {
  if (filter.value === 'active') return todos.value.filter((t) => !t.done)
  if (filter.value === 'done') return todos.value.filter((t) => t.done)
  return todos.value
})

console.log('1. setup runs: the component is being created (not on screen yet)')

let stopListening = null

let stopAuth = null
let stopTodos = null
// don't forget!!!

onMounted(() => {
  stopAuth = onAuthStateChanged(auth, (u) => {
    user.value = u
    authReady.value = true
  })
})

// Each time the user changes, stop the old listener and start one for the new user
watch(user, (u) => {
  if (stopTodos) stopTodos()
  todos.value = []
  summary.value = ''
  if (!u) return

  const q = query(todosCol, where('uid', '==', u.uid), orderBy('createdAt'))
  stopTodos = onSnapshot(
    q,
    (snap) => { todos.value = snap.docs.map((d) => ({ id: d.id, ...d.data() })) },
    (err) => console.error('Could not load todos:', err.message),
  )
})

onUnmounted(() => {
  if (stopAuth) stopAuth()
  if (stopTodos) stopTodos()
})

function logout() {
  signOut(auth)   // the watch above clears the list and stops the listener
}

function addTodo() {
  if (newText.value.trim() === '') return

 const newTodo = {
  text: newText.value.trim(),
  note: newNote.value.trim(),
  important: newImportant.value,
  done: false,
  uid: user.value.uid,          // NEW: whose todo this is
  createdAt: serverTimestamp(),
} 

  newText.value = ''
  newNote.value = ''
  newImportant.value = false

  addDoc(todosCol, newTodo)
}

async function summarize() {
  if (todos.value.length === 0) {
    summary.value = 'Your list is empty. Add a task first!'
    return
  }

  // One task per line, with (important) for important ones
  const format = (t) => `- ${t.text}${t.important ? ' (important)' : ''}`
  const openTodos = todos.value.filter((t) => !t.done).map(format)
  const doneTodos = todos.value.filter((t) => t.done).map(format)

  const prompt = `Summarize this todo list in 2-3 sentences.
Open todos:
${openTodos.length > 0 ? openTodos.join('\n') : 'none'}
Completed todos:
${doneTodos.length > 0 ? doneTodos.join('\n') : 'none'}
Total: ${todos.value.length} todos (${openTodos.length} open, ${doneTodos.length} done)
Tasks marked (important) are important. Mention them first.
Provide a brief, friendly summary. Plain text only, no markdown.`

  summaryError.value = ''
  summarizing.value = true
  try {
    const result = await model.generateContent(prompt)
    summary.value = result.response.text()
  } catch (err) {
    summaryError.value = 'Could not summarize: ' + err.message
  } finally {
    summarizing.value = false
  }
}

function toggleTodo(id) {
  const todo = todos.value.find((t) => t.id === id)
  updateDoc(doc(db, 'todos', id), { done: !todo.done })
}

function removeTodo(id) {
  deleteDoc(doc(db, 'todos', id))
}


function clearDone() {
  const batch = writeBatch(db)
  todos.value
    .filter((t) => t.done)
    .forEach((t) => batch.delete(doc(db, 'todos', t.id)))
  batch.commit()
}

</script>

<template>
  <div class="app">
    <div class="card">
      <h1>{{ title }}</h1>

      <!-- 1. Firebase still checking auth -->
      <p v-if="!authReady" class="empty">Loading…</p>

      <!-- 2. Signed out -->
      <LoginForm v-else-if="!user" />

      <!-- 3. Signed in: full todo UI -->
      <template v-else>
        <p class="sub">
          Hello, {{ user.email }}! {{ remaining }} of {{ todos.length }} tasks left.
          <button class="link" @click="logout">Sign out</button>
        </p>

        <div class="toolbar">
          <button class="link" @click="showTips = !showTips">
            {{ showTips ? 'Hide' : 'Show' }} tips
          </button>
        </div>
        <div v-show="showTips" class="tips">
          Tip: refresh the page. Your tasks are still here.
        </div>

        <form @submit.prevent="addTodo">
          <div class="row">
            <input
              ref="inputEl"
              v-model="newText"
              type="text"
              placeholder="What needs doing?"
              autofocus
            />
            <button class="primary" type="submit" :disabled="!canAdd">Add</button>
          </div>
          <textarea v-model="newNote" rows="2" placeholder="Notes (optional)"></textarea>
          <label class="check">
            <input v-model="newImportant" type="checkbox" /> Important
          </label>
        </form>

        <ul v-if="visibleTodos.length > 0" class="list">
          <TodoItem
            v-for="todo in visibleTodos"
            :key="todo.id"
            :todo="todo"
            @toggle="toggleTodo"
            @remove="removeTodo"
          />
        </ul>
        <p v-else class="empty">Nothing here for "{{ filter }}".</p>
        <div class="summary">
  <button class="primary" :disabled="summarizing" @click="summarize">
    {{ summarizing ? 'Thinking…' : '✨ Summarize my list' }}
  </button>
  <p v-if="summary" class="tips">{{ summary }}</p>
  <p v-if="summaryError" class="msg error">{{ summaryError }}</p>
</div>
        <TodoFilters
          :filter="filter"
          :remaining="remaining"
          :done-count="doneCount"
          @change-filter="filter = $event"
          @clear-done="clearDone"
        />
      </template>
    </div>
  </div>
</template>
