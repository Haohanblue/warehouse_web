<template>
  <div class="stock-container">
    <div class="stock-header">
      <h1>库存实时数据</h1>
      <el-button @click="handleGetDataButton">获取数据</el-button>
      <el-button type="primary" @click="toggleEditMode">
        {{ isEditMode ? '取消' : '修改库存' }}
      </el-button>
      <el-button
        type="primary"
        @click="submitUpdates"
        v-if="isEditMode"
      >
        提交修改
      </el-button>
      <el-button
        type="danger"
        @click="handleClearAllStocks"
      >
        清空库存
      </el-button>
    </div>
    <div class="stock-table">
      <el-tabs v-model="activeMonth" @tab-click="handleTabClick" class="demo-tabs">
        <el-tab-pane
          v-for="month in months"
          :key="month"
          :label="`${month}月`"
          :name="String(month)"
        >
          <el-table :data="tableData[month]" stripe style="width: 100%" :header-cell-style="{ textAlign: 'center' }">
            <!-- 固定左侧产品列 -->
            <el-table-column prop="product" label="产品" fixed width="100" />
            <!-- 动态生成城市列 -->
            <el-table-column
              v-for="(city, cityIndex) in cities"
              :key="city"
              :prop="city"
              :label="city"
              :min-width="50"
              :header-align="'center'"
            >
              <!-- 使用作用域插槽 -->
              <template #default="{ row, $index }">
                <div v-if="isEditMode">
                  <el-input
                    v-model.number="row[city]"
                    size="small"
                    autosize
                    @change="handleCellChange(row, city)"
                    class="cell-input"
                  ></el-input>
                </div>
                <div v-else>
                  {{ row[city] }}
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getStocks, updateStocks, clearAllStocks } from '../api/stocks';
import { ElMessage } from 'element-plus';
import { ref, reactive, onMounted, onBeforeUnmount} from 'vue';
import PubSub from 'pubsub-js'; // 导入 PubSub
import { bulkModifyStocks } from '../api/stocks';
const isEditMode = ref(false); // 编辑模式状态

const modifiedCells = reactive<Set<string>>(new Set());
const activeMonth = ref('1');

const months = [1,2,3,4,5,6,7,8,9,10,11,12];

const products = [
  '品牌茶饮', '品牌果汁', '品牌咖啡', '品牌汽水', '品牌饮用水',
  '网红茶饮', '网红果汁', '网红咖啡', '网红汽水', '网红饮用水',
  '自营茶饮', '自营咖啡', '自营果汁', '自营汽水', '自营饮用水'
];

const cities = [
  '上海', '广州', '武汉', '北京', '济南',
  '苏州', '常熟', '泰安', '深圳', '珠海'
];

const tableData = ref<{ [key: string]: any[] }>({});

const fetchStocks = async () => {
  try {
    const response = await getStocks();
    const stocks = response.data;

    // 初始化 tableData
    months.forEach((month) => {
      tableData.value[month] = [];
    });

    // 创建库存数据的映射
    const stockMap = new Map<string, number>();
    stocks.forEach((stock: any) => {
      const key = `${stock.product_id}-${stock.city_id}-${stock.month_id}`;
      stockMap.set(key, stock.quantity);
    });

    // 构建表格数据
    months.forEach((month) => {
      products.forEach((product, productIndex) => {
        const row: any = { product };
        cities.forEach((city, cityIndex) => {
          const key = `${productIndex + 1}-${cityIndex + 1}-${month}`;
          const quantity = stockMap.get(key) || 0;
          row[city] = quantity;
        });
        tableData.value[month].push(row);
      });
    });

    console.log('获取库存数据成功');
    ElMessage.success('获取库存数据成功');
  } catch (error) {
    console.error('获取库存数据失败：', error);
    ElMessage.error('获取库存数据失败');
  }
};

onMounted(() => {
  fetchStocks();
  let token = '';
  // 订阅消息
  token = PubSub.subscribe('stockUpdated', (msg, data) => {
    fetchStocks();
  })
});

onBeforeUnmount(() => {
  // 取消订阅，防止内存泄漏
  PubSub.unsubscribe(token);
});

const handleTabClick = (tab: any) => {
  // 可根据需要处理标签页点击事件
  activeMonth.value = tab.name;
};

const handleCellChange = (row: any, city: string) => {
  const month = activeMonth.value;
  const productIndex = products.indexOf(row.product);
  const cityIndex = cities.indexOf(city);
  const key = `${month}-${productIndex}-${cityIndex}`;
  modifiedCells.add(key);
};

const submitUpdates = async () => {
  if (modifiedCells.size === 0) {
    ElMessage.warning('没有任何修改');
    return;
  }

  const updates = [];

  const month = parseInt(activeMonth.value);
  modifiedCells.forEach((key) => {
    const [monthStr, productIndexStr, cityIndexStr] = key.split('-');
    const productIndex = parseInt(productIndexStr);
    const cityIndex = parseInt(cityIndexStr);

    const product = products[productIndex];
    const city = cities[cityIndex];
    const row = tableData.value[activeMonth.value].find(
      (item) => item.product === product
    );
    const quantity = row[city];

    updates.push({
      city_id: cityIndex + 1,      // 假设 city_id 从 1 开始
      product_id: productIndex + 1, // 假设 product_id 从 1 开始
      month: month,
      quantity: quantity,
      operation: 'update',  // 指定操作类型为 'update'
    });
  });

  try {
    const response = await bulkModifyStocks({ updates });
    ElMessage.success('库存记录更新成功');
    // 清空修改记录
    modifiedCells.clear();
    // 退出编辑模式
    isEditMode.value = false;
    fetchStocks();
  } catch (error) {
    console.error('更新库存数据失败：', error);
    ElMessage.error('更新库存数据失败');
  }
};
const handleClearAllStocks = async () => {
  try {
    // 显示确认对话框，防止误操作
    await ElMessageBox.confirm(
      '此操作将清空所有库存，是否继续？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    await clearAllStocks();
    ElMessage.success('所有库存已清空');
    // 重新获取库存数据，刷新表格
    await fetchStocks();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空库存失败：', error);
      ElMessage.error('清空库存失败');
    }
  }
};
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
  if (!isEditMode.value) {
    // 如果退出编辑模式，清空修改记录
    modifiedCells.clear();
  }
};
const handleGetDataButton = () => {
  console.log('handleGetDataButton');
  fetchStocks();
};



</script>

<style scoped>
.stock-container {
  width: 100%;
  max-width: 850px; /* 控制表格最大宽度 */
  margin: 0 auto; /* 居中显示 */
  padding: 0px;
  background-color: #f9f9f9;
}

.stock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.stock-header h1 {
  margin: 0;
  font-size: 20px; /* 减小标题字体大小 */
  color: #333;
}

.el-button {
  margin-left: 10px;
}

.stock-table {
  overflow-x: auto; /* 允许横向滚动 */
}

.demo-tabs {
  width: 100%;
}

.el-table th, .el-table td {
  padding: 5px; /* 减小表格单元格的填充 */
  font-size: 12px; /* 减小字体大小 */
}

.el-table-column {
  text-align: center;
}

.cell-input .el-input__inner {
  padding: 2px 5px; /* 减小输入框的填充 */
}

.el-input {
  max-width: 60px; /* 控制输入框的最大宽度 */
}

.el-table--striped .el-table__body tr:nth-child(odd) {
  background-color: #f5f7fa; /* 自定义间隔行颜色 */
}
</style>