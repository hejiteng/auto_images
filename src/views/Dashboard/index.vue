<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="dashboard">
    <h1>施工质检标注系统</h1>
    <p class="subtitle">施工照片错误标注答题系统</p>

    <div class="cards">
      <div class="card" @click="router.push('/practice')">
        <div class="card-icon">📝</div>
        <h3>答题练习</h3>
        <p>在施工照片上圈出问题区域，获取即时评分反馈</p>
      </div>

      <div class="card" @click="router.push('/review')">
        <div class="card-icon">📖</div>
        <h3>错题回顾</h3>
        <p>回顾之前的错题，巩固知识点</p>
      </div>

      <div class="card" @click="router.push('/admin')">
        <div class="card-icon">⚙️</div>
        <h3>后台管理</h3>
        <p>上传新题目，管理题库</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;

  h1 {
    font-size: 32px;
    color: #333;
  }

  .subtitle {
    color: #666;
    margin-bottom: 40px;
  }
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 32px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  }

  .card-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 18px;
    margin: 0 0 8px;
    color: #333;
  }

  p {
    color: #666;
    font-size: 14px;
    margin: 0;
  }
}
</style>
