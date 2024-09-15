<template>
  <div class="app-container">
    <h1 class="app-title">智慧仓储供应链管理系统</h1>
    <el-container class="main-container">
      <!-- 左侧采购/销售组件 -->
      <el-aside :style="{ width: asideWidth + '%' }" class="aside-container">
        <el-tabs v-model="activeTab" tab-position="left">
          <el-tab-pane label="采购入库" name="purchase">
            <purchase />
          </el-tab-pane>
          <el-tab-pane label="销售出库" name="sell">
            <sell />
          </el-tab-pane>
        </el-tabs>
      </el-aside>

      <!-- 拖拽分隔条 -->
      <div class="drag-bar" @mousedown="startDragging"></div>

      <!-- 右侧库存组件 -->
      <el-main class="stock-container">
        <stock />
      </el-main>
    </el-container>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import purchase from './components/purchase.vue';
import sell from './components/sell.vue';
import stock from './components/stock.vue';

const asideWidth = ref(60); // 默认左侧宽度百分比
const activeTab = ref('purchase');
let isDragging = false; // 是否正在拖拽
let startX = 0;

// 开始拖拽
const startDragging = (event: MouseEvent) => {
  isDragging = true;
  startX = event.clientX;

  document.addEventListener('mousemove', handleDragging);
  document.addEventListener('mouseup', stopDragging);
};

// 处理拖拽
const handleDragging = (event: MouseEvent) => {
  if (!isDragging) return;

  // 计算新的宽度百分比
  const delta = event.clientX - startX;
  const containerWidth = document.querySelector('.main-container')?.clientWidth || 1;
  asideWidth.value += (delta / containerWidth) * 100;
  startX = event.clientX;

  // 限制最小和最大百分比
  if (asideWidth.value < 10) asideWidth.value = 10;
  if (asideWidth.value > 90) asideWidth.value = 90;
};

// 停止拖拽
const stopDragging = () => {
  isDragging = false;
  document.removeEventListener('mousemove', handleDragging);
  document.removeEventListener('mouseup', stopDragging);
};
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

#sell{
  margin-left: 0;
  padding: 0;
}
#purchase{
  margin-left: 0;
  padding: 0;
}
#pane-purchase > div{
  padding: 0;
  margin: 0;
}
.app-title {
  text-align: center;
  margin: 20px 0;
  font-size: 24px;
  color: #333;
}

.main-container {
  display: flex;
  flex: 1;
  position: relative;
}

.aside-container {
  background-color: #fff;
  overflow: hidden;
  transition: width 0.2s;
}

.stock-container {
  background-color: #fff;
  overflow: auto;
  flex-grow: 1;
}

.drag-bar {
  width: 5px;
  background-color: #ccc;
  cursor: ew-resize;
  z-index: 10;
}
</style>
