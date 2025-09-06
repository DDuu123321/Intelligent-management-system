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
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number | { enter: number; leave: number };
  appear?: boolean;
  delay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  direction: "up",
  duration: 300,
  appear: false,
  delay: 0,
});

const emit = defineEmits<{
  beforeEnter: [];
  enter: [];
  afterEnter: [];
  beforeLeave: [];
  leave: [];
  afterLeave: [];
}>();

const transitionName = computed(() => `fade-${props.direction}`);

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
  name: "FadeTransition",
};
</script>

<style scoped>
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all v-bind(duration + "ms") ease;
  transition-delay: v-bind(delay + "ms");
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.fade-down-enter-active,
.fade-down-leave-active {
  transition: all v-bind(duration + "ms") ease;
  transition-delay: v-bind(delay + "ms");
}

.fade-down-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.fade-down-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.fade-left-enter-active,
.fade-left-leave-active {
  transition: all v-bind(duration + "ms") ease;
  transition-delay: v-bind(delay + "ms");
}

.fade-left-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-right-enter-active,
.fade-right-leave-active {
  transition: all v-bind(duration + "ms") ease;
  transition-delay: v-bind(delay + "ms");
}

.fade-right-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.fade-none-enter-active,
.fade-none-leave-active {
  transition: opacity v-bind(duration + "ms") ease;
  transition-delay: v-bind(delay + "ms");
}

.fade-none-enter-from,
.fade-none-leave-to {
  opacity: 0;
}
</style>
