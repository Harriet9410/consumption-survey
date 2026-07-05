-- 1. 创建答卷表
CREATE TABLE IF NOT EXISTS responses (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  answers JSONB NOT NULL
);

-- 2. 启用行级安全策略
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- 3. 允许匿名用户插入（填写问卷）
CREATE POLICY "Allow anonymous inserts" ON responses
  FOR INSERT WITH CHECK (true);

-- 4. 仅允许已登录用户查询（管理员后台）
CREATE POLICY "Allow authenticated selects" ON responses
  FOR SELECT USING (auth.role() = 'authenticated');

-- 5. 仅允许已登录用户删除（管理员操作）
CREATE POLICY "Allow authenticated deletes" ON responses
  FOR DELETE USING (auth.role() = 'authenticated');
