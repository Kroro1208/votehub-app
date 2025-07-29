"use client";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";

interface WelcomeSlide {
  title: string;
  description: string;
  emoji: string;
  features: string[];
}

const welcomeSlides: WelcomeSlide[] = [
  {
    title: "みんなの投票で決める「Votehub」へようこそ！",
    description:
      "このアプリは、あなたの意見と他のユーザーの意見を共有し、議論を深めるためのプラットフォームです。",
    emoji: "🎉",
    features: ["投稿の作成と共有", "投票機能", "コメントでの議論"],
  },
  {
    title: "投稿を作成しよう",
    description:
      "あなたの意見やアイデアを投稿して、他のユーザーと共有しましょう。",
    emoji: "✍️",
    features: ["テキスト投稿", "画像の添付", "投票期限の設定"],
  },
  {
    title: "投票で意見を表明",
    description:
      "他のユーザーの投稿に対して賛成・反対の投票をすることができます。",
    emoji: "🗳️",
    features: ["賛成・反対投票", "リアルタイムの結果表示", "投票期限の確認"],
  },
  {
    title: "コメントで議論を深める",
    description: "投稿にコメントを付けて、より深い議論を楽しみましょう。",
    emoji: "💬",
    features: ["コメント投稿", "返信機能", "共感ポイント"],
  },
  {
    title: "ポイントを獲得しよう",
    description:
      "投稿や投票、コメントでポイントを獲得し、アクティブなユーザーを目指しましょう。",
    emoji: "🏆",
    features: ["投稿でポイント獲得", "投票でポイント獲得", "ランキング機能"],
  },
];

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { user } = useAuth();

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % welcomeSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + welcomeSlides.length) % welcomeSlides.length
    );
  };

  const handleComplete = () => {
    if (user?.id && typeof window !== "undefined") {
      localStorage.setItem(`onboarding_completed_${user.id}`, "true");
      localStorage.setItem(
        `onboarding_completed_at_${user.id}`,
        new Date().toISOString()
      );
    }
    onClose();
  };

  const skipOnboarding = () => {
    handleComplete();
  };

  if (!isOpen) return null;

  const currentSlideData = welcomeSlides[currentSlide];
  const isLastSlide = currentSlide === welcomeSlides.length - 1;

  if (!currentSlideData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">{currentSlideData.emoji}</div>
            <h2 className="text-xl font-bold text-gray-800">
              {currentSlideData.title}
            </h2>
          </div>
          <Button
            type="button"
            onClick={skipOnboarding}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-bounce">
              {currentSlideData.emoji}
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">
              {currentSlideData.description}
            </p>
          </div>

          <div className="space-y-4">
            {currentSlideData.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg transform transition-all duration-300 hover:scale-105"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animation: "fadeInUp 0.5s ease-out forwards",
                }}
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {/* Progress Indicator */}
          <div className="flex justify-center space-x-2 mb-4">
            {welcomeSlides.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index === currentSlide ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                currentSlide === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              <ChevronLeft size={20} />
              <span>前へ</span>
            </Button>

            <div className="text-sm text-gray-500">
              {currentSlide + 1} / {welcomeSlides.length}
            </div>

            {isLastSlide ? (
              <Button
                type="button"
                onClick={handleComplete}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
              >
                <span>始める</span>
                <span>🚀</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={nextSlide}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300"
              >
                <span>次へ</span>
                <ChevronRight size={20} />
              </Button>
            )}
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `,
        }}
      />
    </div>
  );
};

export default WelcomeModal;
