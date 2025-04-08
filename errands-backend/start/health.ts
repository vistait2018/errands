import {
  HealthChecks,
  DiskSpaceCheck,
  MemoryHeapCheck,
  MemoryRSSCheck,
} from '@adonisjs/core/health'
import { DbCheck, DbConnectionCountCheck } from '@adonisjs/lucid/database'
import db from '@adonisjs/lucid/services/db'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck().warnWhenExceeds(80).failWhenExceeds(99),
  new MemoryHeapCheck().warnWhenExceeds('300 mb').failWhenExceeds('700 mb'),
  new MemoryRSSCheck().warnWhenExceeds('600 mb').failWhenExceeds('800 mb'),
  new DbCheck(db.connection()),
  new DbConnectionCountCheck(db.connection()),
])
