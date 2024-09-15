<template>
    <div class="sell-container">
      <h1>销售出库</h1>
      <el-button type="primary" @click="submitSales">提交销售</el-button>
      <el-table :data="tableData" class="custom-table">
        <!-- 第一列：产品 -->
        <el-table-column prop="product" label="产品" fixed width="100" />
        <!-- 动态生成城市列 -->
        <el-table-column
          v-for="(city, cityIndex) in cities"
          :key="city"
          :label="city"
          :min-width="120"
        >
          <template #default="{ row }">
            <div class="input-container">
              <el-input
                v-model.number="row[city].quantity"
                placeholder="数量"
                size="mini"
                class="small-input"
              ></el-input>
              <el-input
                v-model.number="row[city].month"
                placeholder="月份"
                size="mini"
                class="small-input"
              ></el-input>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </template>

  <script lang="ts" setup>
  import { ref } from 'vue';
  import { ElMessage } from 'element-plus';
  import { bulkModifyStocks } from '../api/stocks';
  import PubSub from 'pubsub-js'; // 导入 PubSub
  const products = [
    '品牌茶饮', '品牌果汁', '品牌咖啡', '品牌汽水', '品牌饮用水',
    '网红茶饮', '网红果汁', '网红咖啡', '网红汽水', '网红饮用水',
    '自营茶饮', '自营咖啡', '自营果汁', '自营汽水', '自营饮用水'
  ];
  
  const cities = [
    '上海', '广州', '武汉', '北京', '济南',
    '苏州', '常熟', '泰安', '深圳', '珠海'
  ];
  
  // 初始化表格数据
  const tableData = ref<any[]>([]);
  
  products.forEach((product, productIndex) => {
    const row: any = { product };
    cities.forEach((city, cityIndex) => {
      row[city] = {
        quantity: null,
        month: null,
        cityIndex,
        productIndex,
      };
    });
    tableData.value.push(row);
  });
  
  const submitSales = async () => {
    const updates = [];
  
    tableData.value.forEach((row) => {
      const productIndex = products.indexOf(row.product);
      cities.forEach((city) => {
        const cell = row[city];
        const quantity = cell.quantity;
        const month = cell.month;
        if (quantity && month) {
          updates.push({
            city_id: cell.cityIndex + 1,
            product_id: cell.productIndex + 1,
            month: month,
            quantity: quantity,
            operation: 'decrease',  // 指定操作类型为 'decrease'
          });
        }
      });
    });
  
    if (updates.length === 0) {
      ElMessage.warning('没有填写任何销售数据');
      return;
    }
  
    try {
      await bulkModifyStocks({ updates });
      ElMessage.success('销售出库成功');
      PubSub.publish('stockUpdated');
      // 清空输入框
      tableData.value.forEach((row) => {
        cities.forEach((city) => {
          row[city].quantity = null;
          row[city].month = null;
        });
      });
    } catch (error) {
      console.error('销售出库失败：', error);
      ElMessage.error('销售出库失败');
    }
  };
  </script>
  <style scoped>
.sell-container {
    max-width: 100%; /* 控制表格最大宽度 */
}

.custom-table {
  font-size: 12px; /* 减小表格字体大小 */
}

.input-container {
  display: flex;
  gap: 5px; /* 减小输入框之间的间距 */
}

.small-input .el-input__inner {
  padding: 2px 5px; /* 减小输入框的填充 */
  max-width: 60px; /* 控制输入框的最大宽度 */
}
</style>