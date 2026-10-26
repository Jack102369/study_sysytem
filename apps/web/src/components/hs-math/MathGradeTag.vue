<template>
  <el-tag :type="tagType" :effect="effect" size="small">{{ label }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HsMathGradeResult } from '@/api/hs-math-train'
import { applicationMathGradeTagLabel } from '@/utils/hs-math-ai-grade-poll'

const props = withDefaults(
  defineProps<{
    result?: HsMathGradeResult | null
    /** APPLICATION-4C-1：细分 review_required */
    gradeReason?: string | null
    effect?: 'dark' | 'light' | 'plain'
  }>(),
  { result: null, gradeReason: null, effect: 'light' },
)

const label = computed(
  () =>
    applicationMathGradeTagLabel({
      gradeResult: props.result,
      gradeReason: props.gradeReason,
    }) || '未判',
)

const tagType = computed(() => {
  if (props.result === 'correct') return 'success'
  if (props.result === 'wrong') return 'danger'
  if (props.result === 'graded') return 'success'
  if (props.result === 'grading_failed') return 'danger'
  if (
    props.result === 'pending_review' ||
    props.result === 'pending_ai' ||
    props.result === 'grading' ||
    props.result === 'review_required'
  ) {
    return 'warning'
  }
  return 'info'
})
</script>
