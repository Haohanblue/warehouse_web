<template>
    <div>
      <h1>采购入库</h1>
      <el-button type="primary" @click="submitPurchases">提交采购</el-button>
      <el-table :data="tableData" style="width: 100%">
        <!-- 第一列：产品 -->
        <el-table-column prop="product" label="产品" fixed width="150" />
        <!-- 动态生成城市列 -->
        <el-table-column
          v-for="(city, cityIndex) in cities"
          :key="city"
          :label="city"
          :min-width="200"
        >
          <template #default="{ row }">
            <div>
              <el-input
                v-model.number="row[city].quantity"
                placeholder="数量"
                size="small"
              ></el-input>
              <el-input
                v-model.number="row[city].month"
                placeholder="月份"
                size="small"
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
  
  const submitPurchases = async () => {
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
            operation: 'increase',  // 指定操作类型为 'increase'
          });
        }
      });
    });

    console.log(updates);
    if (updates.length === 0) {
      ElMessage.warning('没有填写任何采购数据');
      return;
    }
  
    try {

      await bulkModifyStocks({ updates });
      ElMessage.success('采购入库成功');
      PubSub.publish('stockUpdated');
      // 清空输入框
      tableData.value.forEach((row) => {
        cities.forEach((city) => {
          row[city].quantity = null;
          row[city].month = null;
        });
      });
    } catch (error) {
      console.error('采购入库失败：', error);
      ElMessage.error('采购入库失败');
    }
  };
  </script>
  