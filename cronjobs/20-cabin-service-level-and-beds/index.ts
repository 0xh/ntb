import { Logger, startDuration, printDuration } from '@ntb/utils';
import * as models from '@ntb/models';
import { knex } from '@ntb/db-utils';


const logger = Logger.getLogger();


async function getData(): Promise<models.Cabin[]> {
  return await models.Cabin
    .query()
    .select(
      'id',
      'serviceLevel',
      'idLegacyNtb',
      'bedsStaffed',
      'bedsSelfService',
      'bedsNoService',
    )
    .eager('openingHours')
    .modifyEager('openingHours', (builder) => {
      builder
        .where((b1) => {
          b1
            .where((b2) => {
              const now = new Date();
              b2
                .where('from', '>=', now)
                .andWhere('to', '<=', now);
            })
            .orWhere('allYear', '=', true);
        });
    });
}


async function main(): Promise<void> {
  const cabins = await getData();
  let updateCount = 0;

  for (const cabin of cabins) {
    let dirty = false;
    let serviceLevelToday = cabin.serviceLevel;
    if (cabin.openingHours && cabin.openingHours.length) {
      for (const oh of cabin.openingHours) {
        if (oh.serviceLevel && oh.serviceLevel !== cabin.serviceLevel) {
          serviceLevelToday = oh.serviceLevel;
        }
      }
    }

    if (cabin.serviceLevelToday !== serviceLevelToday) {
      dirty = true;
      cabin.serviceLevelToday = serviceLevelToday;
    }

    let bedsToday = 0;
    const beds = (cabin as any).beds;
    switch (cabin.serviceLevelToday) {
      case 'closed':
      case 'emergency shelter':
      case 'food service':
        bedsToday = 0;
        break;
      case 'staffed':
        bedsToday = beds.staffed || 0;
        break;
      case 'self-service':
        bedsToday = beds.selfService || 0;
        break;
      case 'no-service (no beds)':
      case 'no-service':
        bedsToday = beds.noService || 0;
        break;
      default:
        bedsToday = Math.max(
          beds.staffed || 0,
          beds.selfService || 0,
          beds.noService || 0,
        );
        break;
    }

    if (cabin.bedsToday !== bedsToday) {
      dirty = true;
      cabin.bedsToday = bedsToday;
    }

    if (dirty) {
      const data: (string | number)[] = [];
      let sql = 'UPDATE cabins SET ';

      if (cabin.serviceLevelToday) {
        sql += 'service_level_today=?, ';
        data.push(cabin.serviceLevelToday as string);
      }

      sql += 'beds_today=? WHERE id=?';

      data.push(cabin.bedsToday);
      data.push(cabin.id);
      await knex.raw(sql, data);
      updateCount += 1;
    }
  }

  logger.info(`Updated cabins: ${updateCount}`);
}


const durationId = startDuration();
main()
  .then(() => {
    logger.info('ALL DONE');
    printDuration(durationId);
    process.exit(0);
  })
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    printDuration(durationId);
    logger.error(err);
    logger.error(err.stack);
    process.exit(1);
  });
