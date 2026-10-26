<template>
  <div class="meta-fields">
    <el-divider content-position="left">来源信息</el-divider>
    <el-alert
      v-if="defaultCompat"
      type="info"
      :closable="false"
      show-icon
      title="兼容默认来源：原创 · 未核实 · 许可未知（不等于已核实原创）"
      style="margin-bottom: 10px"
    />
    <el-alert
      v-if="riskHint"
      type="warning"
      :closable="false"
      show-icon
      :title="riskHint"
      style="margin-bottom: 10px"
    />
    <el-row :gutter="12">
      <el-col :span="8">
        <el-form-item label="来源类型">
          <el-select v-model="model.sourceType" style="width: 100%" @change="emitChange">
            <el-option label="原创" value="original" />
            <el-option label="高考真题改编" value="adapted" />
            <el-option label="历年高考真题" value="past_exam" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="核实状态">
          <el-select
            v-model="model.sourceVerificationStatus"
            style="width: 100%"
            @change="emitChange"
          >
            <el-option label="未核实" value="unverified" />
            <el-option label="已核实" value="verified" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="使用许可">
          <el-select
            v-model="model.sourceLicenseStatus"
            style="width: 100%"
            @change="emitChange"
          >
            <el-option label="允许使用" value="permitted" />
            <el-option label="许可未知" value="unknown" />
            <el-option label="限制使用" value="restricted" />
            <el-option label="禁止使用" value="forbidden" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <template v-if="needsProvenance">
      <el-alert
        type="warning"
        :closable="false"
        :title="
          model.sourceType === 'adapted'
            ? '改编题须填写年份、试卷、题号、出处与改编说明（后端将校验）'
            : '历年真题须填写年份、试卷、题号与出处（后端将校验）'
        "
        style="margin-bottom: 10px"
      />
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="年份">
            <el-input-number
              v-model="model.sourceYear"
              :min="1990"
              :max="2100"
              controls-position="right"
              style="width: 100%"
              @change="emitChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="试卷名称">
            <el-input
              v-model="model.sourceExamName"
              maxlength="128"
              show-word-limit
              clearable
              @input="emitChange"
              @clear="emitChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="原题题号">
            <el-input
              v-model="model.sourceQuestionNo"
              maxlength="32"
              show-word-limit
              clearable
              @input="emitChange"
              @clear="emitChange"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="出处 / 参考">
        <el-input
          v-model="model.sourceReference"
          type="textarea"
          :rows="2"
          maxlength="512"
          show-word-limit
          clearable
          placeholder="出版信息或链接（勿冒充未授权真题）"
          @input="emitChange"
          @clear="emitChange"
        />
      </el-form-item>
      <el-form-item v-if="model.sourceType === 'adapted'" label="改编说明">
        <el-input
          v-model="model.sourceAdaptationNote"
          type="textarea"
          :rows="2"
          maxlength="512"
          show-word-limit
          clearable
          @input="emitChange"
          @clear="emitChange"
        />
      </el-form-item>
    </template>

    <el-divider content-position="left">解题方法</el-divider>
    <el-alert
      v-if="!methodOptions.length"
      type="info"
      :closable="false"
      title="方法词典为空或未加载到可用方法。可先在「解题方法」页维护；不影响题干编辑。"
      style="margin-bottom: 10px"
    />
    <el-form-item label="关联方法（多选，顺序=展示序）">
      <el-select
        v-model="model.methodIds"
        multiple
        filterable
        clearable
        style="width: 100%"
        placeholder="选择方法"
        @change="onMethodIdsChange"
      >
        <el-option
          v-for="m in selectableMethods"
          :key="m.id"
          :label="`${m.name}（${m.code}）${m.isActive ? '' : ' · 已禁用'}`"
          :value="m.id"
          :disabled="!m.isActive && !model.methodIds.includes(m.id)"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="主要方法">
      <el-select
        v-model="model.primaryMethodId"
        clearable
        style="width: 100%"
        placeholder="至多一个；须属于已选方法"
        :disabled="!model.methodIds.length"
        @change="emitChange"
      >
        <el-option
          v-for="m in selectedMethodOptions"
          :key="m.id"
          :label="m.name"
          :value="m.id"
        />
      </el-select>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HsMathAdminMethod } from '@/api/hs-math-admin'
import {
  isDefaultSourceCompat,
  sourceLicenseRiskHint,
} from '@/utils/hs-math-format'
import type { SourceMethodDraft } from '@/utils/hs-math-admin-meta'

export type SourceMethodModel = SourceMethodDraft

const props = defineProps<{
  model: SourceMethodModel
  methodOptions: HsMathAdminMethod[]
}>()

const emit = defineEmits<{
  change: []
}>()

const needsProvenance = computed(
  () =>
    props.model.sourceType === 'adapted' ||
    props.model.sourceType === 'past_exam',
)

const defaultCompat = computed(() => isDefaultSourceCompat(props.model))
const riskHint = computed(() => sourceLicenseRiskHint(props.model))

const selectableMethods = computed(() => {
  const byId = new Map(props.methodOptions.map((m) => [m.id, m]))
  // 已选但词典中缺失的（禁用后仍展示）由 methodOptions 全量列表覆盖
  return props.methodOptions.length
    ? props.methodOptions
    : [...byId.values()]
})

const selectedMethodOptions = computed(() =>
  selectableMethods.value.filter((m) => props.model.methodIds.includes(m.id)),
)

function emitChange() {
  emit('change')
}

function onMethodIdsChange() {
  if (
    props.model.primaryMethodId &&
    !props.model.methodIds.includes(props.model.primaryMethodId)
  ) {
    props.model.primaryMethodId = props.model.methodIds[0] || ''
  }
  if (!props.model.primaryMethodId && props.model.methodIds.length === 1) {
    props.model.primaryMethodId = props.model.methodIds[0]
  }
  emitChange()
}
</script>
