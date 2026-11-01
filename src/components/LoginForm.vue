<script setup>
import { ref } from 'vue'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

const email = ref('')
const password = ref('')
const busy = ref(false)      // replaces disabling buttons by hand
const msg = ref('')          // replaces setMsg()
const msgKind = ref('')      // 'error' | 'ok' | ''

function setMsg(text, kind = '') {
  msg.value = text
  msgKind.value = kind
}

// Shorter messages for students than Firebase's raw "Firebase: Error (auth/...)"
function friendly(err) {
  const map = {
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/email-already-in-use': 'That email already has an account. Try signing in.',
    'auth/invalid-email': 'That email address looks wrong.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many tries. Wait a moment and try again.',
  }
  return map[err.code] || err.message
}
// if the left side (map[err.code]) is undefined, use the original error message

async function signIn() {
  setMsg('')
  busy.value = true
  try {
    await signInWithEmailAndPassword(auth, email.value.trim(), password.value)
    // No need to do anything here: App.vue's onAuthStateChanged switches the screen
  } catch (err) {
    setMsg(friendly(err), 'error')
  } finally {
    busy.value = false
  }
}

async function signUp() {
  if (!email.value.trim() || !password.value) {
    setMsg('Please enter email and password.', 'error')
    return
  }
  if (password.value.length < 6) {
    setMsg('Password must be at least 6 characters.', 'error')
    return
  }
  setMsg('')
  busy.value = true
  try {
    await createUserWithEmailAndPassword(auth, email.value.trim(), password.value)
    // Creating an account also signs you in, so App switches screens automatically
  } catch (err) {
    setMsg(friendly(err), 'error')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <form @submit.prevent="signIn">
    <input v-model="email" type="email" placeholder="Email" autocomplete="email" />
    <input
      v-model="password"
      type="password"
      placeholder="Password (min 6 characters)"
      autocomplete="current-password"
    />
    <div class="row">
      <button class="primary" type="submit" :disabled="busy">Sign in</button>
      <button type="button" :disabled="busy" @click="signUp">Create account</button>
    </div>
    <p v-if="msg" class="msg" :class="msgKind">{{ msg }}</p>
  </form>
</template>