import env from '#start/env'

export const getBvnAndNINKey = (): string | undefined => env.get('BVN_KEY')
