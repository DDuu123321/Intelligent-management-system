<template>
  <Transition
    :name="transitionName"
    :appear="appear"
    :duration="duration"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
  >
    <slot />
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  mode?: "zoom-in" | "zoom-out" | "bounce" | "elastic";
  duration?: number | { enter: number; leave: number };
  appear?: boolean;
  delay?: number;
  origin?: string;
}

const props = withDefaults(defineProps<Props>(), {
  mode: "zoom-in",
  duration: 300,
  appear: false,
  delay: 0,
  origin: "center",
});

const emit = defineEmits<{
  beforeEnter: [];
  enter: [];
  afterEnter: [];
  beforeLeave: [];
  leave: [];
  afterLeave: [];
}>();

const transitionName = computed(() => `scale-${props.mode}`);

const onBeforeEnter = () => emit("beforeEnter");
const onEnter = () => emit("enter");
const onAfterEnter = () => emit("afterEnter");
const onBeforeLeave = () => emit("beforeLeave");
const onLeave = () => emit("leave");
const onAfterLeave = () => emit("afterLeave");
</script>

<script lang="ts">
import { computed } from "vue";
export default {
  name: "ScaleTransition",
};
</script>

<style scoped>
.scale-zoom-in-enter-active {
  transition: all v-bind(duration + "ms") ease;
  transition-delay: v-bind(delay + "ms");
  transform-origin: v-bind(origin);
}

.scale-zoom-in-leave-active {
  transition: all v-bind(duration + "ms") ease;
  transform-origin: v-bind(origin);
}

.scale-zoom-in-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.scale-zoom-in-leave-to {
  opacity: 0;
  transform: scale(1.1);
}

.scale-zoom-out-enter-active {
  transition: all v-bind(duration + "ms") ease;
  transition-delay: v-bind(delay + "ms");
  transform-origin: v-bind(origin);
}

.scale-zoom-out-leave-active {
  transition: all v-bind(duration + "ms") ease;
  transform-origin: v-bind(origin);
}

.scale-zoom-out-enter-from {
  opacity: 0;
  transform: scale(1.2);
}

.scale-zoom-out-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.scale-bounce-enter-active {
  animation: bounceIn v-bind(duration + "ms") ease;
  animation-delay: v-bind(delay + "ms");
  transform-origin: v-bind(origin);
}

.scale-bounce-leave-active {
  animation: bounceOut v-bind(duration + "ms") ease;
  transform-origin: v-bind(origin);
}

.scale-elastic-enter-active {
  animation: elasticIn v-bind(duration + "ms") ease;
  animation-delay: v-bind(delay + "ms");
  transform-origin: v-bind(origin);
}

.scale-elastic-leave-active {
  animation: elasticOut v-bind(duration + "ms") ease;
  transform-origin: v-bind(origin);
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounceOut {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(0.95);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    opacity: 0;
    transform: scale(0.3);
  }
}

@keyframes elasticIn {
  0% {
    opacity: 0;
    transform: scale(0.1) rotate(30deg);
  }
  50% {
    transform: scale(1.05) rotate(-10deg);
  }
  70% {
    transform: scale(0.95) rotate(3deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes elasticOut {
  0% {
    transform: scale(1) rotate(0deg);
  }
  30% {
    transform: scale(1.05) rotate(3deg);
  }
  50% {
    transform: scale(0.95) rotate(-10deg);
  }
  100% {
    opacity: 0;
    transform: scale(0.1) rotate(30deg);
  }
}
</style>
