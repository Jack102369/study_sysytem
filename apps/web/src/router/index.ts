import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import SettingsLayout from '@/layouts/SettingsLayout.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import DashboardView from '@/views/DashboardView.vue'
import SubjectsView from '@/views/settings/SubjectsView.vue'
import TagsView from '@/views/settings/TagsView.vue'
import CategoriesView from '@/views/settings/CategoriesView.vue'
import AssessmentTypesView from '@/views/settings/AssessmentTypesView.vue'
import UsersView from '@/views/settings/UsersView.vue'
import FeaturesView from '@/views/settings/FeaturesView.vue'
import StudyPrefsView from '@/views/settings/StudyPrefsView.vue'
import RewardsView from '@/views/settings/RewardsView.vue'
import PetCompanionView from '@/views/settings/PetCompanionView.vue'
import ErrorsListView from '@/views/errors/ErrorsListView.vue'
import ErrorEditView from '@/views/errors/ErrorEditView.vue'
import ErrorDetailView from '@/views/errors/ErrorDetailView.vue'
import ErrorStatsView from '@/views/errors/ErrorStatsView.vue'
import ReviewsTodayView from '@/views/reviews/ReviewsTodayView.vue'
import ExtensionMaterialsView from '@/views/extensions/ExtensionMaterialsView.vue'
import ListeningView from '@/views/listening/ListeningView.vue'
import AiReferenceView from '@/views/ai-reference/AiReferenceView.vue'
import WritingCoachView from '@/views/writing-coach/WritingCoachView.vue'
import KnowledgeCardsView from '@/views/knowledge-cards/KnowledgeCardsView.vue'
import ChemistryHomeView from '@/views/chemistry/ChemistryHomeView.vue'
import ChemistrySpecialtyView from '@/views/chemistry/ChemistrySpecialtyView.vue'
import ChemistryKbHomeView from '@/views/chemistry/ChemistryKbHomeView.vue'
import ChemistryKbDetailView from '@/views/chemistry/ChemistryKbDetailView.vue'
import ChemistryKbAdminView from '@/views/settings/chemistry/ChemistryKbAdminView.vue'
import ChemistryTrainGeneratorView from '@/views/settings/chemistry/ChemistryTrainGeneratorView.vue'
import ChemistryTrainItemsAdminView from '@/views/settings/chemistry/ChemistryTrainItemsAdminView.vue'
import ChemistryTrainSetupView from '@/views/chemistry/ChemistryTrainSetupView.vue'
import ChemistryTrainSessionView from '@/views/chemistry/ChemistryTrainSessionView.vue'
import ChemistryTrainResultView from '@/views/chemistry/ChemistryTrainResultView.vue'
import ChemistryTrainHistoryView from '@/views/chemistry/ChemistryTrainHistoryView.vue'
import ChemistryDailyReviewView from '@/views/chemistry/ChemistryDailyReviewView.vue'
import ChemistryAdvancedTrainSetupView from '@/views/chemistry/ChemistryAdvancedTrainSetupView.vue'
import ChemistryWrongQuestionsView from '@/views/chemistry/ChemistryWrongQuestionsView.vue'
import ChemistryWrongQuestionDetailView from '@/views/chemistry/ChemistryWrongQuestionDetailView.vue'
import ChemistryAnalyticsView from '@/views/chemistry/ChemistryAnalyticsView.vue'
import AssessmentsView from '@/views/assessments/AssessmentsView.vue'
import TrendsView from '@/views/assessments/TrendsView.vue'
import InsightView from '@/views/assessments/InsightView.vue'
import { getToken } from '@/utils/auth-token'
import { fetchMe } from '@/api/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: DashboardView },
        { path: 'errors', name: 'errors', component: ErrorsListView },
        { path: 'errors/new', name: 'error-new', component: ErrorEditView },
        { path: 'errors/stats', name: 'error-stats', component: ErrorStatsView },
        { path: 'errors/:id/edit', name: 'error-edit', component: ErrorEditView },
        { path: 'errors/:id', name: 'error-detail', component: ErrorDetailView },
        { path: 'reviews', name: 'reviews', component: ReviewsTodayView },
        { path: 'extensions', name: 'extensions', component: ExtensionMaterialsView },
        { path: 'listening', name: 'listening', component: ListeningView },
        { path: 'ai-reference', name: 'ai-reference', component: AiReferenceView, meta: { requiresAi: true } },
        { path: 'writing-coach', name: 'writing-coach', component: WritingCoachView, meta: { requiresAi: true } },
        {
          path: 'knowledge-cards',
          name: 'knowledge-cards',
          component: KnowledgeCardsView,
          meta: { requiresAi: true },
        },
        { path: 'chemistry', name: 'chemistry', component: ChemistryHomeView },
        {
          path: 'chemistry/kb',
          name: 'chemistry-kb',
          component: ChemistryKbHomeView,
        },
        {
          path: 'chemistry/kb/:type/:id',
          name: 'chemistry-kb-detail',
          component: ChemistryKbDetailView,
        },
        {
          path: 'chemistry/train/history',
          name: 'chemistry-train-history',
          component: ChemistryTrainHistoryView,
        },
        {
          path: 'chemistry/daily',
          name: 'chemistry-daily',
          component: ChemistryDailyReviewView,
        },
        {
          path: 'chemistry/advanced',
          name: 'chemistry-advanced',
          component: ChemistryAdvancedTrainSetupView,
        },
        {
          path: 'chemistry/analytics',
          name: 'chemistry-analytics',
          component: ChemistryAnalyticsView,
        },
        {
          path: 'chemistry/wrong-questions',
          name: 'chemistry-wrong-questions',
          component: ChemistryWrongQuestionsView,
        },
        {
          path: 'chemistry/wrong-questions/:id',
          name: 'chemistry-wrong-question-detail',
          component: ChemistryWrongQuestionDetailView,
        },
        {
          path: 'chemistry/train/session/:id',
          name: 'chemistry-train-session',
          component: ChemistryTrainSessionView,
        },
        {
          path: 'chemistry/train/result/:id',
          name: 'chemistry-train-result',
          component: ChemistryTrainResultView,
        },
        {
          path: 'chemistry/:code/train',
          name: 'chemistry-train-setup',
          component: ChemistryTrainSetupView,
        },
        {
          path: 'chemistry/:code',
          name: 'chemistry-specialty',
          component: ChemistrySpecialtyView,
        },
        { path: 'assessments', name: 'assessments', component: AssessmentsView },
        { path: 'assessments/trends', name: 'trends', component: TrendsView },
        {
          path: 'assessments/insight/:subjectId',
          name: 'insight',
          component: InsightView,
        },
        {
          path: 'settings',
          component: SettingsLayout,
          redirect: '/settings/subjects',
          children: [
            { path: 'subjects', name: 'settings-subjects', component: SubjectsView },
            { path: 'tags', name: 'settings-tags', component: TagsView },
            { path: 'study-prefs', name: 'settings-study-prefs', component: StudyPrefsView },
            { path: 'rewards', name: 'settings-rewards', component: RewardsView },
            { path: 'pet', name: 'settings-pet', component: PetCompanionView },
            { path: 'categories', name: 'settings-categories', component: CategoriesView },
            {
              path: 'assessment-types',
              name: 'settings-assessment-types',
              component: AssessmentTypesView,
            },
            {
              path: 'users',
              name: 'settings-users',
              component: UsersView,
              meta: { requiresAdmin: true },
            },
            {
              path: 'features',
              name: 'settings-features',
              component: FeaturesView,
              meta: { requiresAdmin: true },
            },
            {
              path: 'chemistry',
              name: 'settings-chemistry',
              component: ChemistryKbAdminView,
              meta: { requiresAdmin: true },
            },
            {
              path: 'chemistry-generator',
              name: 'settings-chemistry-generator',
              component: ChemistryTrainGeneratorView,
              meta: { requiresAdmin: true },
            },
            {
              path: 'chemistry-train-items',
              name: 'settings-chemistry-train-items',
              component: ChemistryTrainItemsAdminView,
              meta: { requiresAdmin: true },
            },
          ],
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const needAuth = to.matched.some((r) => r.meta.requiresAuth)
  if (needAuth && !getToken()) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  const needAdmin = to.matched.some((r) => r.meta.requiresAdmin)
  const needAi = to.matched.some((r) => r.meta.requiresAi)
  if (needAdmin || needAi) {
    if (!getToken()) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    try {
      const me = await fetchMe()
      if (needAdmin && me.role !== 'ADMIN') {
        return { path: '/settings/subjects' }
      }
      if (needAi && !me.aiEnabled) {
        return { path: '/' }
      }
    } catch {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }

  return true
})

export default router
