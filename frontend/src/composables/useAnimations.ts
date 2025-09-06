import { ref, nextTick } from "vue";

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  stagger?: number;
}

export function useAnimations() {
  const isAnimating = ref(false);
  const animationQueue = ref<Array<() => Promise<void>>>([]);

  // 基础动画函数
  const animate = async (
    element: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions = {},
  ): Promise<Animation> => {
    const defaultOptions: KeyframeAnimationOptions = {
      duration: 300,
      easing: "ease-out",
      fill: "both",
    };

    const animation = element.animate(keyframes, {
      ...defaultOptions,
      ...options,
    });

    return new Promise((resolve) => {
      animation.onfinish = () => resolve(animation);
    });
  };

  // 淡入动画
  const fadeIn = async (
    element: HTMLElement,
    config: AnimationConfig = {},
  ): Promise<void> => {
    await animate(element, [{ opacity: 0 }, { opacity: 1 }], {
      duration: config.duration || 300,
      delay: config.delay || 0,
      easing: config.easing || "ease-out",
    });
  };

  // 淡出动画
  const fadeOut = async (
    element: HTMLElement,
    config: AnimationConfig = {},
  ): Promise<void> => {
    await animate(element, [{ opacity: 1 }, { opacity: 0 }], {
      duration: config.duration || 300,
      delay: config.delay || 0,
      easing: config.easing || "ease-in",
    });
  };

  // 滑入动画
  const slideIn = async (
    element: HTMLElement,
    direction: "up" | "down" | "left" | "right" = "up",
    config: AnimationConfig = {},
  ): Promise<void> => {
    const transforms = {
      up: ["translateY(30px)", "translateY(0)"],
      down: ["translateY(-30px)", "translateY(0)"],
      left: ["translateX(30px)", "translateX(0)"],
      right: ["translateX(-30px)", "translateX(0)"],
    };

    await animate(
      element,
      [
        { opacity: 0, transform: transforms[direction][0] },
        { opacity: 1, transform: transforms[direction][1] },
      ],
      {
        duration: config.duration || 400,
        delay: config.delay || 0,
        easing: config.easing || "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    );
  };

  // 缩放动画
  const scaleIn = async (
    element: HTMLElement,
    config: AnimationConfig = {},
  ): Promise<void> => {
    await animate(
      element,
      [
        { opacity: 0, transform: "scale(0.8)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      {
        duration: config.duration || 300,
        delay: config.delay || 0,
        easing: config.easing || "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    );
  };

  // 弹跳动画
  const bounceIn = async (
    element: HTMLElement,
    config: AnimationConfig = {},
  ): Promise<void> => {
    await animate(
      element,
      [
        { opacity: 0, transform: "scale(0.3)" },
        { opacity: 1, transform: "scale(1.05)", offset: 0.5 },
        { transform: "scale(0.9)", offset: 0.7 },
        { opacity: 1, transform: "scale(1)" },
      ],
      {
        duration: config.duration || 600,
        delay: config.delay || 0,
        easing: config.easing || "ease-out",
      },
    );
  };

  // 摇摆动画
  const shake = async (
    element: HTMLElement,
    config: AnimationConfig = {},
  ): Promise<void> => {
    await animate(
      element,
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-10px)", offset: 0.1 },
        { transform: "translateX(10px)", offset: 0.2 },
        { transform: "translateX(-10px)", offset: 0.3 },
        { transform: "translateX(10px)", offset: 0.4 },
        { transform: "translateX(-10px)", offset: 0.5 },
        { transform: "translateX(10px)", offset: 0.6 },
        { transform: "translateX(-10px)", offset: 0.7 },
        { transform: "translateX(10px)", offset: 0.8 },
        { transform: "translateX(-10px)", offset: 0.9 },
        { transform: "translateX(0)" },
      ],
      {
        duration: config.duration || 500,
        delay: config.delay || 0,
        easing: config.easing || "ease-in-out",
      },
    );
  };

  // 脉冲动画
  const pulse = async (
    element: HTMLElement,
    config: AnimationConfig = {},
  ): Promise<void> => {
    await animate(
      element,
      [
        { transform: "scale(1)" },
        { transform: "scale(1.05)", offset: 0.5 },
        { transform: "scale(1)" },
      ],
      {
        duration: config.duration || 1000,
        delay: config.delay || 0,
        easing: config.easing || "ease-in-out",
        iterations: Infinity,
      },
    );
  };

  // 交错动画
  const staggeredAnimation = async (
    elements: NodeListOf<Element> | Element[],
    animationFn: (el: HTMLElement, config?: AnimationConfig) => Promise<void>,
    config: AnimationConfig = {},
  ): Promise<void> => {
    const staggerDelay = config.stagger || 100;
    const promises: Promise<void>[] = [];

    Array.from(elements).forEach((element, index) => {
      const elementConfig = {
        ...config,
        delay: (config.delay || 0) + index * staggerDelay,
      };
      promises.push(animationFn(element as HTMLElement, elementConfig));
    });

    await Promise.all(promises);
  };

  // 动画队列
  const addToQueue = (animationFn: () => Promise<void>) => {
    animationQueue.value.push(animationFn);
  };

  const executeQueue = async () => {
    if (isAnimating.value || animationQueue.value.length === 0) return;

    isAnimating.value = true;

    for (const animationFn of animationQueue.value) {
      await animationFn();
    }

    animationQueue.value = [];
    isAnimating.value = false;
  };

  // 页面过渡动画
  const pageTransition = async (
    enterElement: HTMLElement,
    leaveElement?: HTMLElement,
  ) => {
    if (leaveElement) {
      await Promise.all([
        fadeOut(leaveElement, { duration: 200 }),
        slideIn(enterElement, "right", { duration: 400, delay: 100 }),
      ]);
    } else {
      await slideIn(enterElement, "up", { duration: 400 });
    }
  };

  // 卡片悬停效果
  const cardHover = (element: HTMLElement, isEntering: boolean) => {
    const scale = isEntering ? "scale(1.02)" : "scale(1)";
    const shadow = isEntering
      ? "0 12px 40px rgba(0, 0, 0, 0.15)"
      : "0 4px 20px rgba(0, 0, 0, 0.1)";

    element.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    element.style.transform = scale;
    element.style.boxShadow = shadow;
  };

  // 按钮点击效果
  const buttonClick = async (element: HTMLElement) => {
    await animate(
      element,
      [
        { transform: "scale(1)" },
        { transform: "scale(0.95)", offset: 0.5 },
        { transform: "scale(1)" },
      ],
      {
        duration: 150,
        easing: "ease-in-out",
      },
    );
  };

  return {
    isAnimating,
    animate,
    fadeIn,
    fadeOut,
    slideIn,
    scaleIn,
    bounceIn,
    shake,
    pulse,
    staggeredAnimation,
    addToQueue,
    executeQueue,
    pageTransition,
    cardHover,
    buttonClick,
  };
}
