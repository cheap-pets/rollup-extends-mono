module.exports = {
  types: [
    {
      value: '✨ 特性',
      name: ' - 增加新的特性'
    },
    {
      value: '🐛 修复',
      name: ' - 代码缺陷修复'
    },
    {
      value: '🔨 重构',
      name: ' - 项目源码重构'
    },
    {
      value: '🎉 初始',
      name: ' - 初始提交内容'
    },
    {
      value: '📝 文档',
      name: ' - 用户文档更新'
    },
    {
      value: '🔥 清理',
      name: ' - 移除无用代码'
    },
    {
      value: '✅ 测试',
      name: ' - 测试代码变更'
    },
    {
      value: '🔧 配置',
      name: ' - 工具配置变动'
    }
  ],

  messages: {
    type: '请选择提交内容的所属类型:',
    scope: '\n请选择提交内容的所属范围 (可选):',
    customScope: '请指明提交内容的所属范围:',
    subject: '请输入提交内容的标题:\n',
    body: '请输入提交内容的详细描述（可选，使用 “｜” 进行换行:\n',
    breaking: '任何发生了颠覆变化的内容（可选）:\n',
    footer: '任何相关的问题号，例如: #31, #34（可选）:\n',
    confirmCommit: '确认提交上述内容吗？'
  },

  skipQuestions: ['scope', 'body'],

  allowCustomScopes: false,
  allowBreakingChanges: ['feat', 'fix'],

  subjectLimit: 100
}
