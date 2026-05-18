export type UserRole = 'admin' | 'client'
export type ProjectStatus = 'new' | 'discovery' | 'design' | 'development' | 'revision' | 'done'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
  emailVerified: boolean
}

export interface DashboardSummary {
  totalProjects: number
  activeProjects: number
  pendingRevisions: number
  overdueProjects: number
}

export interface DashboardRecentProject {
  id: string
  title: string
  status: ProjectStatus
  updatedAt: string
}

export interface ProjectListItem {
  id: string
  title: string
  businessName: string
  websiteType: string
  status: ProjectStatus
  deadline: string
  updatedAt: string
  ownerName: string
}

export interface ProjectRevision {
  id: string
  message: string
  createdAt: string
  authorName: string
  authorRole: UserRole
}

export interface ProjectDetail {
  id: string
  ownerUserId: string
  title: string
  businessName: string
  websiteType: string
  objective: string
  references: string
  preferredStyle: string
  requestedPages: string
  requestedFeatures: string
  budget: string
  deadline: string
  notes: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  ownerName: string
  ownerEmail: string
  revisions: ProjectRevision[]
}
