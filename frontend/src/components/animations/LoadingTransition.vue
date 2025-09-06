<template>
  <Transition name="loading" :appear="appear" :duration="duration">
    <div v-if="loading" class="loading-overlay" :class="overlayClass">
      <div class="loading-content" :class="contentClass">
        <component
          :is="spinnerComponent"
          :size="spinnerSize"
          :color="spinnerColor"
          :class="spinnerClass"
        />
        <div v-if="text" class="loading-text" :class="textClass">
          {{ text }}
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  loading: boolean;
  text?: string;
  spinner?: "dots" | "circle" | "pulse" | "bars";
  spinnerSize?: number;
  spinnerColor?: string;
  overlay?: boolean;
  blur?: boolean;
  duration?: number;
  appear?: boolean;
  overlayClass?: string;
  contentClass?: string;
  spinnerClass?: string;
  textClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  spinner: "circle",
  spinnerSize: 40,
  spinnerColor: "#409EFF",
  overlay: true,
  blur: true,
  duration: 300,
  appear: true,
});

const spinnerComponent = computed(() => {
  const spinners = {
    dots: "DotsSpinner",
    circle: "CircleSpinner",
    pulse: "PulseSpinner",
    bars: "BarsSpinner",
  };
  return spinners[props.spinner];
});
</script>

<script lang="ts">
import { computed } from "vue";
export default {
  name: "LoadingTransition",
  components: {
    DotsSpinner: {
      props: ["size", "color"],
      template: `
        <div class="dots-spinner" :style="{ '--size': size + 'px', '--color': color }">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      `,
    },
    CircleSpinner: {
      props: ["size", "color"],
      template: `
        <div class="circle-spinner" :style="{ '--size': size + 'px', '--color': color }">
          <div class="circle"></div>
        </div>
      `,
    },
    PulseSpinner: {
      props: ["size", "color"],
      template: `
        <div class="pulse-spinner" :style="{ '--size': size + 'px', '--color': color }">
          <div class="pulse"></div>
        </div>
      `,
    },
    BarsSpinner: {
      props: ["size", "color"],
      template: `
        <div class="bars-spinner" :style="{ '--size': size + 'px', '--color': color }">
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
        </div>
      `,
    },
  },
};
</script>

<style scoped>
.loading-enter-active,
.loading-leave-active {
  transition: all v-bind(duration + "ms") ease;
}

.loading-enter-from,
.loading-leave-to {
  opacity: 0;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-overlay.blur {
  backdrop-filter: blur(4px);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-text {
  color: #666;
  font-size: 14px;
  margin-top: 8px;
}

/* Dots Spinner */
.dots-spinner {
  display: flex;
  gap: 4px;
}

.dots-spinner .dot {
  width: calc(var(--size) * 0.2);
  height: calc(var(--size) * 0.2);
  border-radius: 50%;
  background-color: var(--color);
  animation: dotPulse 1.4s ease-in-out infinite both;
}

.dots-spinner .dot:nth-child(1) {
  animation-delay: -0.32s;
}
.dots-spinner .dot:nth-child(2) {
  animation-delay: -0.16s;
}
.dots-spinner .dot:nth-child(3) {
  animation-delay: 0;
}

@keyframes dotPulse {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Circle Spinner */
.circle-spinner .circle {
  width: var(--size);
  height: var(--size);
  border: 3px solid rgba(64, 158, 255, 0.2);
  border-top-color: var(--color);
  border-radius: 50%;
  animation: circleRotate 1s linear infinite;
}

@keyframes circleRotate {
  to {
    transform: rotate(360deg);
  }
}

/* Pulse Spinner */
.pulse-spinner .pulse {
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  background-color: var(--color);
  animation: pulseScale 1s ease-in-out infinite;
}

@keyframes pulseScale {
  0%,
  100% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    transform: scale(1);
    opacity: 0.3;
  }
}

/* Bars Spinner */
.bars-spinner {
  display: flex;
  gap: 3px;
  align-items: center;
}

.bars-spinner .bar {
  width: calc(var(--size) * 0.1);
  height: var(--size);
  background-color: var(--color);
  animation: barStretch 1.2s ease-in-out infinite;
}

.bars-spinner .bar:nth-child(1) {
  animation-delay: -0.9s;
}
.bars-spinner .bar:nth-child(2) {
  animation-delay: -0.6s;
}
.bars-spinner .bar:nth-child(3) {
  animation-delay: -0.3s;
}
.bars-spinner .bar:nth-child(4) {
  animation-delay: 0s;
}

@keyframes barStretch {
  0%,
  40%,
  100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}
</style>
