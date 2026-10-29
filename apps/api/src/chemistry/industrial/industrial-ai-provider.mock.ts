import { buildSaltPurificationDiagram } from './industrial-diagram.fixtures'
import {
  IndustrialAiError,
  type IndustrialAiChatRequest,
  type IndustrialAiChatResponse,
  type IndustrialAiProvider,
  type MockProviderScenario,
} from './industrial-ai-provider.types'
import type { IndustrialAiRawOutput } from './prompts/industrial-question.schema'

function baseSuccess(qtype: 'single' | 'judge' | 'blank'): IndustrialAiRawOutput {
  const def = buildSaltPurificationDiagram()
  const nodes = def.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    displayLabel: n.displayLabel,
    displayRole: n.displayRole,
    presentation: n.presentation as Record<string, unknown> | undefined,
    internal: n.internal
      ? {
          ...(n.internal.materialId ? { materialId: n.internal.materialId } : {}),
          ...(n.internal.stepId ? { stepId: n.internal.stepId } : {}),
          ...(n.internal.reactionReference
            ? { reactionReference: n.internal.reactionReference }
            : {}),
          ...(n.internal.unknownKey ? { unknownKey: n.internal.unknownKey } : {}),
          ...(n.internal.answerLabel ? { answerLabel: n.internal.answerLabel } : {}),
        }
      : undefined,
  }))
  const edges = def.edges.map((e) => ({
    id: e.id,
    from: e.from,
    to: e.to,
    type: e.type,
    displayLabel: e.displayLabel,
  }))

  if (qtype === 'single') {
    return {
      schemaVersion: '1.0',
      question: {
        stem: '粗盐提纯流程中，操作①的主要作用是去除什么？',
        options: ['可溶性杂质盐', '不溶性杂质', '全部水分', '改变盐的化学式'],
        answerType: 'single',
        referencedNodeIds: ['n_filter'],
        referencedLabels: ['操作①'],
      },
      answer: 'B',
      explanation: '操作①对应过滤，用于分离不溶性杂质；题干与流程图中的操作①对应。',
      difficulty: 1,
      qtype: 'single',
      knowledgePoints: ['过滤', '固液分离'],
      caseReferences: {
        caseCode: 'salt_purification_basic',
        caseVersion: def.caseVersion,
      },
      diagramDefinition: {
        diagramId: def.diagramId,
        diagramVersion: def.diagramVersion,
        title: def.title,
        orientation: def.orientation,
        nodes,
        edges,
      },
      generationNotes: 'mock_success_single',
    }
  }

  if (qtype === 'judge') {
    return {
      schemaVersion: '1.0',
      question: {
        stem: '粗盐提纯的「溶解→过滤→蒸发结晶」流程一定能除去所有可溶性杂质盐。',
        options: null,
        answerType: 'judge',
        referencedLabels: ['粗盐'],
      },
      answer: false,
      explanation: '该教学简化流程主要针对不溶性杂质；可溶性杂质需其他方法。',
      difficulty: 2,
      qtype: 'judge',
      knowledgePoints: ['粗盐提纯', '杂质类型'],
      caseReferences: {
        caseCode: 'salt_purification_basic',
        caseVersion: def.caseVersion,
      },
      diagramDefinition: {
        diagramId: def.diagramId,
        diagramVersion: def.diagramVersion,
        title: def.title,
        orientation: def.orientation,
        nodes,
        edges,
      },
      generationNotes: 'mock_success_judge',
    }
  }

  return {
    schemaVersion: '1.0',
    question: {
      stem: '流程图中蒸发结晶步骤的 stepId 对应名称是____（填工艺步骤名）。',
      options: null,
      answerType: 'blank',
      referencedNodeIds: ['n_evap'],
      referencedLabels: ['蒸发结晶'],
    },
    answer: '蒸发结晶',
    explanation: '对应案例 processSteps 中蒸发结晶步骤。',
    difficulty: 1,
    qtype: 'blank',
    knowledgePoints: ['蒸发', '结晶'],
    caseReferences: {
      caseCode: 'salt_purification_basic',
      caseVersion: def.caseVersion,
    },
    diagramDefinition: {
      diagramId: def.diagramId,
      diagramVersion: def.diagramVersion,
      title: def.title,
      orientation: def.orientation,
      nodes,
      edges,
    },
    generationNotes: 'mock_success_blank',
    requiresManualReview: false,
  }
}

/**
 * Mock Provider：与 HTTP 同接口；输出可控；明确 kind=mock。
 */
export class IndustrialAiMockProvider implements IndustrialAiProvider {
  readonly kind = 'mock' as const
  scenario: MockProviderScenario

  constructor(scenario: MockProviderScenario = 'success_single') {
    this.scenario = scenario
  }

  isAvailable(): boolean {
    return true
  }

  getConfigSummary() {
    return {
      enabled: true,
      baseUrl: 'mock://industrial-ai',
      model: 'mock-industrial-v1',
      timeoutMs: 1000,
      maxRetries: 0,
      configSource: 'mock' as const,
      apiKeyConfigured: false,
    }
  }

  async chat(req: IndustrialAiChatRequest): Promise<IndustrialAiChatResponse> {
    const started = Date.now()
    void req

    switch (this.scenario) {
      case 'timeout':
        throw new IndustrialAiError('AI_TIMEOUT', 'mock timeout', { retryable: true })
      case 'auth_failed':
        throw new IndustrialAiError('AI_AUTH_FAILED', 'mock auth', {
          status: 401,
          retryable: false,
        })
      case 'network_error':
        throw new IndustrialAiError('AI_NETWORK_ERROR', 'mock network', { retryable: true })
      case 'empty_response':
        throw new IndustrialAiError('AI_EMPTY_RESPONSE', 'mock empty', { retryable: true })
      case 'invalid_json':
        return {
          providerKind: 'mock',
          model: 'mock-industrial-v1',
          content: 'not-json{{{',
          durationMs: Date.now() - started,
          tokenUsage: { promptTokens: null, completionTokens: null, totalTokens: null, available: false },
        }
      case 'invalid_schema':
        return this.wrap({ schemaVersion: '9.9', foo: 1 } as never, started)
      case 'bad_material_ref': {
        const o = baseSuccess('single')
        o.diagramDefinition.nodes[0].internal = { materialId: 'm_does_not_exist' }
        return this.wrap(o, started)
      }
      case 'bad_step_ref': {
        const o = baseSuccess('single')
        const n = o.diagramDefinition.nodes.find((x) => x.internal?.stepId)
        if (n?.internal) n.internal.stepId = 's_missing'
        return this.wrap(o, started)
      }
      case 'bad_node': {
        const o = baseSuccess('single')
        o.diagramDefinition.nodes.push({
          id: 'bad!',
          type: 'not_a_type',
          displayLabel: '坏节点',
        })
        return this.wrap(o, started)
      }
      case 'bad_edge': {
        const o = baseSuccess('single')
        o.diagramDefinition.edges.push({
          id: 'e_bad',
          from: 'nope',
          to: 'n_product',
          type: 'material_flow',
        })
        return this.wrap(o, started)
      }
      case 'answer_leak': {
        const o = baseSuccess('single')
        const unk = o.diagramDefinition.nodes.find((n) => n.type === 'unknown')
        if (unk) {
          unk.displayLabel = '过滤（标准答案）'
          unk.internal = { ...(unk.internal || {}), answerLabel: '过滤' }
        }
        return this.wrap(o, started)
      }
      case 'success_judge':
        return this.wrap(baseSuccess('judge'), started)
      case 'success_blank':
        return this.wrap(baseSuccess('blank'), started)
      case 'success_single':
      default:
        return this.wrap(baseSuccess('single'), started)
    }
  }

  private wrap(obj: IndustrialAiRawOutput | Record<string, unknown>, started: number): IndustrialAiChatResponse {
    return {
      providerKind: 'mock',
      model: 'mock-industrial-v1',
      content: JSON.stringify(obj),
      durationMs: Date.now() - started,
      tokenUsage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
        available: true,
      },
    }
  }
}
