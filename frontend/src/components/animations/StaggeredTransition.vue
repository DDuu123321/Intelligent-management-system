<template>
  <TransitionGroup
    :name="transitionName"
    :appear="appear"
    :duration="duration"
    tag="div"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
  >
    <slot />
  </TransitionGroup>
</template>

<script setup lang="ts">
interface Props {
  direction?: "up" | "down" | "left" | "right";
  stagger?: number;
  duration?: number;
  appear?: boolean;
  baseDelay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  direction: "up",
  stagger: 100,
  duration: 400,
  appear: true,
  baseDelay: 0,
});

const emit = defineEmits<{
  beforeEnter: [el: Element];
  enter: [el: Element];
  afterEnter: [el: Element];
  beforeLeave: [el: Element];
  leave: [el: Element];
  afterLeave: [el: Element];
}>();

const transitionName = computed(() => `staggered-${props.direction}`);

const onBeforeEnter = (el: Element) => {
  const index = Array.from(el.parentElement?.children || []).indexOf(el);
  (el as HTMLElement).style.transitionDelay =
    `${props.baseDelay + index * props.stagger}ms`;
  emit("beforeEnter", el);
};

const onEnter = (el: Element) => emit("enter", el);
const onAfterEnter = (el: Element) => emit("afterEnter", el);

const onBeforeLeave = (el: Element) => {
  const index = Array.from(el.parentElement?.children || []).indexOf(el);
  (el as HTMLElement).style.transitionDelay = `${index * props.stagger}ms`;
  emit("beforeLeave", el);
};

const onLeave = (el: Element) => emit("leave", el);
const onAfterLeave = (el: Element) => emit("afterLeave", el);
</script>

<script lang="ts">
import { computed } from "vue";
export default {
  name: "StaggeredTransition",
};
</script>

<style scoped>
.staggered-up-enter-active,
.staggered-up-leave-active {
  transition: all v-bind(duration + "ms") cubic-bezier(0.4, 0, 0.2, 1);
}

.staggered-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.staggered-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.staggered-down-enter-active,
.staggered-down-leave-active {
  transition: all v-bind(duration + "ms") cubic-bezier(0.4, 0, 0.2, 1);
}

.staggered-down-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.staggered-down-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.staggered-left-enter-active,
.staggered-left-leave-active {
  transition: all v-bind(duration + "ms") cubic-bezier(0.4, 0, 0.2, 1);
}

.staggered-left-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.staggered-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.staggered-right-enter-active,
.staggered-right-leave-active {
  transition: all v-bind(duration + "ms") cubic-bezier(0.4, 0, 0.2, 1);
}

.staggered-right-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.staggered-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.staggered-up-move,
.staggered-down-move,
.staggered-left-move,
.staggered-right-move {
  transition: transform v-bind(duration + "ms") cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
