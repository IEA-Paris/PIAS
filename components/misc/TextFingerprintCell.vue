<template>
  <g
    :class="
      (isHeading ? 'is-heading' : '') +
      (isMedia ? 'is-hl' : '') +
      'type-' +
      type
    "
  >
    <style>
      .origin {
        /*   fill: black; */
      }
      .is-hl {
        fill: white;
        stroke: white;
      }

      .heading-placeholder {
        fill: transparent;
        stroke: white;
      }
      circle {
        fill: transparent;
        stroke: white;
      }
    </style>
    <line
      :x1="ox"
      :y1="oy"
      :x2="cx"
      :y2="cy"
      :stroke="isHeading ? 'white' : '#FFFFF0'"
    ></line>
    <circle class="origin" :cx="ox" :cy="oy" :r="1" />
    <circle
      v-if="isHeading"
      class="heading-placeholder"
      :cx="ox"
      :cy="oy"
      :r="3"
    />
    <circle
      v-if="refsRadius"
      class="refs"
      :class="isMedia ? 'is-hl' : ''"
      :cx="cosTheta * (offsetRadius + originRadius + refsRadius + 5)"
      :cy="sinTheta * (offsetRadius + originRadius + refsRadius + 5)"
      :r="refsRadius"
    />

    <circle :cx="cx" :cy="cy" :r="circleRadius"></circle>
  </g>
</template>
<script>
// export component
export default {
  props: {
    type: {
      type: String,
      required: false,
      default: 'markdown',
    },
    index: {
      type: Number,
      required: false,
      default: 0,
    },
    theta: {
      type: Number,
      required: false,
      default: 0,
    },
    originRadius: {
      type: Number,
      required: false,
      default: 100,
    },
    radius: {
      type: Number,
      required: false,
      default: 100,
    },
    offsetRadius: {
      type: Number,
      required: false,
      default: 10,
    },
    circleRadius: {
      type: Number,
      required: false,
      default: 2.5,
    },
    refsRadius: {
      type: Number,
      required: false,
      default: 0,
    },
    isHeading: {
      type: Boolean,
      required: false,
      default: false,
    },
    isMedia: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      cosTheta: Math.cos(this.theta),
      sinTheta: Math.sin(this.theta),
      // position in x,y of the center of the small circle representing the Cell
      cx: Math.cos(this.theta) * (this.offsetRadius + this.originRadius),
      cy: Math.sin(this.theta) * (this.offsetRadius + this.originRadius),
      // coordinates in x y of the origin
      ox: Math.cos(this.theta) * this.originRadius,
      oy: Math.sin(this.theta) * this.originRadius,
    }
  },
}
</script>
