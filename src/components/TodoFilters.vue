<!--
  The footer: counts, filter buttons, "clear done".
  It only DISPLAYS what the parent gives it, and REPORTS clicks back.
-->
<script setup>
defineProps({
  filter: { type: String, required: true },
  remaining: { type: Number, required: true },
  doneCount: { type: Number, required: true },
})

const emit = defineEmits(['change-filter', 'clear-done'])
const options = ['all', 'active', 'done']
</script>

<template>
  <div class="footer">
    <span>{{ remaining }} {{ remaining === 1 ? 'item' : 'items' }} left</span>
    <div class="filters">
      <button
        v-for="option in options"
        :key="option"
        :class="{ active: filter === option }"
        @click="emit('change-filter', option)"
      >
        {{ option[0].toUpperCase() + option.slice(1) }}
      </button>
    </div>
    <button v-if="doneCount > 0" class="link" @click="emit('clear-done')">
      Clear done ({{ doneCount }})
    </button>
  </div>
</template>
