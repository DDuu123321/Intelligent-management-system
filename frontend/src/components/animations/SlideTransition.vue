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
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  duration?: number | { enter: number; leave: number };
  appear?: boolean;
  delay?: number;
  easing?: string;
}

const props = withDefaults(defineProps<Props>(), {
  direction: "up",
  distance: 100,
  duration: 400,
  appear: false,
  delay: 0,
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
});

const emit = defineEmits<{
  beforeEnter: [];
  enter: [];
  afterEnter: [];
  beforeLeave: [];
  leave: [];
  afterLeave: [];
}>();

const transitionName = computed(() => `slide-${props.direction}`);

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
  name: "SlideTransition",
};
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all v-bind(duration + "ms") v-bind(easing);
  transition-delay: v-bind(delay + "ms");
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(v-bind(distance + "px"));
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(v-bind(-distance + "px"));
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all v-bind(duration + "ms") v-bind(easing);
  transition-delay: v-bind(delay + "ms");
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(v-bind(-distance + "px"));
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(v-bind(distance + "px"));
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all v-bind(duration + "ms") v-bind(easing);
  transition-delay: v-bind(delay + "ms");
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(v-bind(distance + "px"));
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(v-bind(-distance + "px"));
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all v-bind(duration + "ms") v-bind(easing);
  transition-delay: v-bind(delay + "ms");
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(v-bind(-distance + "px"));
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(v-bind(distance + "px"));
}
</style>
