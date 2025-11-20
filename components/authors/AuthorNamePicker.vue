<template>
  <div class="d-flex alphabet-container flex-wrap justify-center my-6">
    <v-btn
      v-for="(letter, index) in [
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'U',
        'V',
        'W',
        'X',
        'Y',
        'Z',
      ]"
      :key="index"
      class="px-0"
      :aria-label="$t('aria.filter-by-letter', [letter])"
      text
      @click="$emit('letter', letter)"
    >
      {{ letter }}
    </v-btn>
  </div>
</template>

<script setup></script>

<style lang="scss" scoped>
.alphabet-container {
  .v-btn.v-size--default {
    min-width: 32px !important;
  }
}
</style>
