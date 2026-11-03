import type { ChurchState } from './types'

export function createEmptyState(): ChurchState {
  return {
    users: [],
    members: [],
    events: [],
    ministries: [],
    attendance: [],
    donations: [],
    announcements: [],
    settings: {
      name: '',
      tagline: '',
      logoUrl: null,
      address: '',
      phone: '',
      email: '',
      mission: '',
      vision: '',
      schedules: [],
    },
  }
}
