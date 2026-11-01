<!--
  CHECKPOINT 6 — Lifecycle hooks (onMounted)
  New: onMounted() to load saved data and focus the input once the page is on screen.

  Functions in this checkpoint: addTodo, toggleTodo, removeTodo, clearDone
  (same four; each one now also saves the list to localStorage as its last line)
-->
<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
// ADD THESE 3 LINES:
import { doc, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db, todosCol } from './firebase'

const title = ref('My Todo List')
const user = reactive({ name: 'Student', streak: 1 })


// Start EMPTY. The data arrives in onMounted, just like data from a server will.
const todos = ref([])

const showTips = ref(false)

const newText = ref('')
const newNote = ref('')
const newImportant = ref(false)

// A "template ref": Vue puts the real <input> element in here after mounting
const inputEl = ref(null)

const filter = ref('all')

const remaining = computed(() => todos.value.filter((t) => !t.done).length)
const doneCount = computed(() => todos.value.length - remaining.value)
const canAdd = computed(() => newText.value.trim().length > 0)

const visibleTodos = computed(() => {
  if (filter.value === 'active') return todos.value.filter((t) => !t.done)
  if (filter.value === 'done') return todos.value.filter((t) => t.done)
  return todos.value
})

console.log('1. setup runs: the component is being created (not on screen yet)')

onMounted(() => {
  console.log('2. onMounted: the component is on screen')

  // Load the saved list (or the defaults the first time)
  const saved = localStorage.getItem('todos')
  todos.value = saved ? JSON.parse(saved) : DEFAULT_TODOS

  // The <input> exists now, so we can focus it
  inputEl.value.focus()
})

function addTodo() {
  if (newText.value.trim() === '') return

  todos.value.push({
    id: Date.now(),
    text: newText.value.trim(),
    note: newNote.value.trim(),
    important: newImportant.value,
    done: false,
  })

  newText.value = ''
  newNote.value = ''
  newImportant.value = false

  localStorage.setItem('todos', JSON.stringify(todos.value))
}

function toggleTodo(id) {
  const todo = todos.value.find((t) => t.id === id)
  todo.done = !todo.done

  localStorage.setItem('todos', JSON.stringify(todos.value))
}

function removeTodo(id) {
  todos.value = todos.value.filter((t) => t.id !== id)

  localStorage.setItem('todos', JSON.stringify(todos.value))
}

function clearDone() {
  todos.value = todos.value.filter((t) => !t.done)

  localStorage.setItem('todos', JSON.stringify(todos.value))
}
</script>

<template>
  <div class="app">
    <div class="card">
      <h1>{{ title }}</h1>
      <p class="sub">Hello, {{ user.name }}! {{ remaining }} of {{ todos.length }} tasks left.</p>

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
          <input ref="inputEl" v-model="newText" type="text" placeholder="What needs doing?" />
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

      <TodoFilters
        :filter="filter"
        :remaining="remaining"
        :done-count="doneCount"
        @change-filter="filter = $event"
        @clear-done="clearDone"
      />
    </div>
  </div>
</template>
