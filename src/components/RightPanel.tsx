const RightPanel = () => {
  return (
    <div className="fixed right-6 top-32 w-72 hidden xl:block">
      <div className="bg-yellow-100 rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
        <h3 className="font-semibold text-slate-800 mb-3">
          🔥 トレンドトピック
        </h3>
        <div className="space-y-3">
          {["環境問題", "テクノロジー", "スポーツ"].map((topic, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-slate-600">#{topic}</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                {Math.floor(Math.random() * 50 + 10)}票
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-100 rounded-xl shadow-sm border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-800 mb-3">⏰ 終了間近</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-sm">
              <p className="text-slate-800 font-medium">投票タイトル{i}</p>
              <p className="text-orange-600 text-xs">残り {i * 2}時間</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
