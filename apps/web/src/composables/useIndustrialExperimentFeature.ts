import { computed, ref } from 'vue'
import {
  fetchIndustrialExperimentFeature,
  type IndustrialExperimentFeatureStatus,
} from '@/api/chemistry-features'

const status = ref<IndustrialExperimentFeatureStatus>({
  enabled: false,
  specialtyCode: 'industrial_experiment',
  envKey: 'CHEM_INDUSTRIAL_EXPERIMENT_ENABLED',
  note: 'pending',
})
const loaded = ref(false)
let inflight: Promise<void> | null = null

export function useIndustrialExperimentFeature() {
  async function refresh() {
    if (inflight) return inflight
    inflight = (async () => {
      status.value = await fetchIndustrialExperimentFeature()
      loaded.value = true
      inflight = null
    })()
    return inflight
  }

  if (!loaded.value && !inflight) {
    void refresh()
  }

  return {
    status,
    loaded,
    enabled: computed(() => !!status.value.enabled),
    refresh,
  }
}
