<template>
  <div class="mt-12">
    <div class="text-h5">
      {{ $t('positions-and-institutions') }}
      <AuthorsBioHint></AuthorsBioHint>
    </div>
    <v-list
      v-for="(bio, index) in item.positions_and_institutions"
      :key="index"
      two-line
      class=""
    >
      <template v-if="bio.positions && bio.positions.length">
        <v-list-item
          v-for="title in bio.positions"
          :key="title"
          class="pl-0"
          three-lines
        >
          <template v-if="title && title.length">
            <!-- TODO add image from institution (ROR powered or smthing else) 
              <v-list-item-avatar>
          <v-icon
            :class="file.color"
            dark
            v-text="file.icon"
          ></v-icon>
        </v-list-item-avatar> -->
            <v-list-item-content>
              <v-list-item-title v-html="title"></v-list-item-title>
              <v-list-item-subtitle>{{ bio.institution }}</v-list-item-subtitle>
            </v-list-item-content>
          </template>
        </v-list-item>
      </template>
      <v-list-item v-else class="pl-0">
        <v-list-item-content>
          {{ bio.institution }}
        </v-list-item-content>
      </v-list-item>
      <v-divider></v-divider>
    </v-list>
  </div>
</template>
<script>
export default {
  props: {
    item: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {}
  },
  computed: {},
  mounted() {},
  methods: {},
}
</script>
<style lang="scss"></style>
