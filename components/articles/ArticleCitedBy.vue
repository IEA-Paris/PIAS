<template>
  <v-row class="transition-swing">
    <v-col cols="12" :class="$vuetify.breakpoint.xs ? 'pa-2' : 'pa-12'">
      <p class="text-caption text--secondary mb-6">
        {{ $t('cited-by-source') }}
      </p>

      <!-- Works that cite this article -->
      <template v-if="citing.length">
        <div class="overline mb-3">
          {{ $tc('cited-by-count', citing.length, { count: citing.length }) }}
        </div>
        <v-list class="py-0 mb-6" dense>
          <v-list-item
            v-for="entry in citing"
            :key="entry.oci || entry.doi"
            class="px-0"
            :href="'https://doi.org/' + entry.doi"
            target="_blank"
            rel="noopener"
          >
            <v-list-item-icon class="mr-3">
              <v-icon small>mdi-arrow-bottom-left-thick</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="text-body-2">
                {{ entry.doi }}
              </v-list-item-title>
            </v-list-item-content>
            <v-list-item-action>
              <v-icon small>mdi-open-in-new</v-icon>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </template>

      <!-- Works this article references -->
      <template v-if="cited.length">
        <div class="overline mb-3">
          {{ $tc('references-count', cited.length, { count: cited.length }) }}
        </div>
        <v-list class="py-0" dense>
          <v-list-item
            v-for="entry in cited"
            :key="entry.oci || entry.doi"
            class="px-0"
            :href="'https://doi.org/' + entry.doi"
            target="_blank"
            rel="noopener"
          >
            <v-list-item-icon class="mr-3">
              <v-icon small>mdi-arrow-top-right-thick</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="text-body-2">
                {{ entry.doi }}
              </v-list-item-title>
            </v-list-item-content>
            <v-list-item-action>
              <v-icon small>mdi-open-in-new</v-icon>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </template>
    </v-col>
  </v-row>
</template>
<script>
export default {
  props: {
    item: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {}
  },
  computed: {
    citing() {
      return this.item.citedBy?.citing || []
    },
    cited() {
      return this.item.citedBy?.cited || []
    },
  },
  mounted() {},
  methods: {},
}
</script>
<style lang="scss"></style>
