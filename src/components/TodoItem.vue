<!--
  One row of the list.
  Data comes DOWN as a prop. Changes go UP as events.
  Rule: a child never edits its props directly. It asks the parent to.
-->
<script setup>
const props = defineProps({
  todo: { type: Object, required: true },
})

const emit = defineEmits(['toggle', 'remove'])
</script>

<template>
  <li class="item" :class="{ done: todo.done }">
    <input type="checkbox" :checked="todo.done" @change="emit('toggle', props.todo.id)" />
    <span class="text">
      {{ todo.text }}
      <span v-if="todo.important" class="tag">Important</span>
      <span v-if="todo.note" class="note">{{ todo.note }}</span>
    </span>
    <button class="remove" @click="emit('remove', props.todo.id)">✕</button>
  </li>
</template>
