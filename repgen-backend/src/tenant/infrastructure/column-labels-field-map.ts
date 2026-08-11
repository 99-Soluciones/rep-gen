import { columnLabelsRelations as relations } from '../../filemaker/relations';

export const columnLabelsFieldMapJson = {
  data: {
    prefCliente: {
      classify1: `classify1_name_v0_20_0`,
      classify2: `classify2_name_v0_20_0`,
      classify3: `classify3_name_v0_20_0`,
      classify4: `classify4_name_v0_20_0`,
    },
    prefInv: {
      classify1: `${relations.prefInv._}::classify1_name_v0_20_0`,
      classify2: `${relations.prefInv._}::classify2_name_v0_20_0`,
      classify3: `${relations.prefInv._}::classify3_name_v0_20_0`,
      classify4: `${relations.prefInv._}::classify4_name_v0_20_0`,
    },
  },
} as const;
