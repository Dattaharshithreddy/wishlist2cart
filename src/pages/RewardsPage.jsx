import React, { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRewards } from "../contexts/RewardContext";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

const SPIN_PRIZES = [
  { label: "₹100 OFF", type: "coupon", value: 100 },
  { label: "5% Cashback", type: "cashback", value: 5 },
  { label: "No Prize", type: "none" },
  { label: "Free Shipping", type: "shipping" },
  { label: "Extra 50 Coins", type: "coins", value: 50 },
  { label: "₹250 OFF", type: "coupon", value: 250 },
  { label: "10% Cashback", type: "cashback", value: 10 },
  { label: "₹50 OFF", type: "coupon", value: 50 },
];
const SLICE_COLORS = ["#ec4899", "#7c3aed"];
const SPIN_SIZE = 320;
const SPIN_DURATION = 6000;

function generateUniqueCode() {
  return "W2C-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

function SpinWheel({ canSpin, onSpinResult, onSpinDenied }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [prizeIndex, setPrizeIndex] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const wheelRef = useRef(null);

  const startSpin = () => {
    if (isSpinning) return;
    if (!canSpin) {
      onSpinDenied();
      return;
    }
    const randomIdx = Math.floor(Math.random() * SPIN_PRIZES.length);
    setPrizeIndex(randomIdx);
    setIsSpinning(true);

    const spinsCount = 10;
    const anglePerSlice = 360 / SPIN_PRIZES.length;
    const rotationDegree =
      360 * spinsCount + (360 - randomIdx * anglePerSlice - anglePerSlice / 2);

    if (wheelRef.current) {
      wheelRef.current.style.transition = `transform ${SPIN_DURATION}ms cubic-bezier(0.33, 1, 0.68, 1)`;
      wheelRef.current.style.transform = `rotate(${rotationDegree}deg)`;
    }

    setTimeout(() => {
      confetti({ particleCount: 400, spread: 130, origin: { y: 0.6 } });
      setIsSpinning(false);
      setModalOpen(true);
      onSpinResult(SPIN_PRIZES[randomIdx]);
    }, SPIN_DURATION);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const renderSlices = () => {
    const radius = SPIN_SIZE / 2;
    const anglePerSlice = 360 / SPIN_PRIZES.length;
    return SPIN_PRIZES.map((prize, idx) => {
      const startAngle = anglePerSlice * idx - 90;
      const midAngle = startAngle + anglePerSlice / 2;

      const labelLength = prize.label.length;
      const fontSize = labelLength > 14 ? 12 : labelLength > 7 ? 16 : 20;
      const insetFactor = labelLength > 14 ? 0.56 : labelLength > 7 ? 0.64 : 0.72;
      const textRadius = radius * insetFactor;

      const midRadians = (midAngle * Math.PI) / 180;
      const textX = radius + textRadius * Math.cos(midRadians);
      const textY = radius + textRadius * Math.sin(midRadians);

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = ((startAngle + anglePerSlice) * Math.PI) / 180;
      const x1 = radius + radius * Math.cos(startRad);
      const y1 = radius + radius * Math.sin(startRad);
      const x2 = radius + radius * Math.cos(endRad);
      const y2 = radius + radius * Math.sin(endRad);
      const largeArcFlag = anglePerSlice > 180 ? 1 : 0;
      const pathD = `M${radius},${radius} L${x1},${y1} A${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;

      const gradientId = `gradient${idx}`;
      const colorClass = SLICE_COLORS[idx % SLICE_COLORS.length];

      return (
        <g key={idx}>
          <defs>
            <linearGradient
              id={gradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor={colorClass === "#ec4899" ? "#ec4899" : "#7c3aed"}
              />
              <stop
                offset="100%"
                stopColor={colorClass === "#ec4899" ? "#fbbf24" : "#a855f7"}
              />
            </linearGradient>
          </defs>
          <path fill={`url(#${gradientId})`} d={pathD} />
          <text
            x={textX}
            y={textY}
            fontFamily="Poppins, Inter, Arial, sans-serif"
            fontSize={fontSize}
            fontWeight={700}
            fill="#fff"
            stroke="#000a"
            strokeWidth={0.85}
            paintOrder="stroke fill"
            style={{
              userSelect: "none",
              pointerEvents: "none",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.7))",
            }}
            textAnchor="middle"
            alignmentBaseline="middle"
            transform={`rotate(${midAngle} ${textX} ${textY})`}
            aria-label={prize.label}
          >
            {prize.label}
          </text>
        </g>
      );
    });
  };

  return (
    <section className="my-10 text-center select-none" aria-live="polite">
      <h2 className="daily-spin-heading font-extrabold mb-4 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
        Daily Spin & Win
      </h2>
      <div className="spin-wheel-container">
        <svg
          ref={wheelRef}
          className="rounded-full shadow-lg bg-white dark:bg-gray-900 transition-colors cursor-pointer"
          viewBox={`0 0 ${SPIN_SIZE} ${SPIN_SIZE}`}
          onClick={startSpin}
          style={{ userSelect: "none" }}
          aria-label="Spin the wheel"
          role="img"
          tabIndex={0}
        >
          {renderSlices()}
        </svg>
        <div className="spin-pointer">▼</div>
      </div>
      <Button
        onClick={startSpin}
        disabled={isSpinning || !canSpin}
        className="mt-8 px-12 py-4 text-xl font-extrabold tracking-wide"
        aria-live="polite"
        aria-disabled={isSpinning || !canSpin}
      >
        {isSpinning ? "Spinning..." : canSpin ? "Spin Now 🎉" : "Come back tomorrow"}
      </Button>
      {modalOpen && prizeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
            tabIndex={0}
          >
            <h2 className="text-2xl font-extrabold mb-4 text-purple-700 dark:text-purple-400">
              🎉 Congratulations! 🎉
            </h2>
            <p className="text-lg mb-6">
              You won <strong>{SPIN_PRIZES[prizeIndex]?.label}</strong>
            </p>
            <Button onClick={closeModal}>Awesome</Button>
          </div>
        </div>
      )}
    </section>
  );
}

function LoyaltyAndBadges({ loyaltyPoints, badges, onPointsChanged }) {
  const { toast } = useToast();
  const [points, setPoints] = useState(loyaltyPoints || 0);
  const [userBadges, setUserBadges] = useState([]);

  useEffect(() => {
    if (!badges) return;
    const uniqueBadges = Array.from(new Set(badges));
    setUserBadges(uniqueBadges);
  }, [badges]);

  const earnPoints = (amount) => {
    const newPoints = points + amount;
    setPoints(newPoints);
    onPointsChanged(newPoints);
    toast({ title: `You earned ${amount} points!`, variant: "success" });
    if (newPoints >= 100 && !userBadges.includes("100_points")) {
      setUserBadges((prev) => [...prev, "100_points"]);
      toast({
        title: "Badge Earned!",
        description: "100 Points Milestone",
        variant: "success",
      });
    }
  };

  const nextMilestone = 200;
  const progressPercent = Math.min(100, Math.floor((points / nextMilestone) * 100));

  return (
    <section className="my-6 p-4 bg-gradient-to-r from-yellow-50 to-pink-400 dark:from-gray-800 dark:to-pink-600 rounded-xl shadow-inner select-none">
      <h3 className="font-bold text-lg mb-2 dark:text-white">Loyalty Points: {points}</h3>
      <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-4">
        <div
          className="bg-pink-600 h-4 rounded-full transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-xs mt-1 dark:text-gray-300">
        {progressPercent}% towards next tier ({nextMilestone} points)
      </p>
      <div className="mt-4 space-x-2">
        {userBadges.map((b) => (
          <span
            key={b}
            className="inline-block bg-pink-700 text-white px-2 py-1 rounded-full text-xs font-semibold capitalize shadow"
          >
            {b.replace(/_/g, " ")}
          </span>
        ))}
      </div>
    </section>
  );
}

function ReferralPopup({ user }) {
  const [visible, setVisible] = useState(false);
  const referralURL = `${window.location.origin}/signup?ref=${user?.uid || ""}`;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={`
          fixed bottom-6 right-6 z-50 rounded-full
          font-bold tracking-wide uppercase
          bg-gradient-to-tr from-violet-100 via-white to-pink-100
          dark:from-[#24243e] dark:via-gray-900 dark:to-[#4A306D]
          text-violet-700 dark:text-pink-200
          border border-violet-300 dark:border-pink-600
          shadow-2xl
          transition-all
          hover:bg-pink-50 dark:hover:bg-[#2d1a49]
        `}
        style={{
          boxShadow: "0 4px 24px 0 rgba(140, 74, 218, 0.13)",
        }}
        onClick={() => setVisible(true)}
        aria-label="Invite friends to earn rewards"
      >
        <span className="inline-flex items-center gap-2">
          <svg
            width="1.1em"
            height="1.1em"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M18 8a6 6 0 1 1-11.847 1.528A4.485 4.485 0 0 0 1 13.5V15a1 1 0 0 0 1 1h14a2 2 0 0 0 2-2V8z" />
          </svg>
          Invite & Earn
        </span>
      </Button>

      {visible && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
          onClick={() => setVisible(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 p-6 rounded-lg max-w-sm w-full relative"
            onClick={(e) => e.stopPropagation()}
            tabIndex={0}
          >
            <h3 className="text-xl font-bold mb-3 text-center dark:text-white">
              Invite your friends & earn rewards!
            </h3>
            <input
              type="text"
              readOnly
              value={referralURL}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              onFocus={(e) => e.target.select()}
              aria-label="Referral link"
            />
            <div className="mt-4 flex space-x-2">
              <Button
                className="flex-grow"
                onClick={() => {
                  navigator.clipboard.writeText(referralURL);
                  alert("Referral link copied to clipboard!");
                }}
              >
                Copy Link
              </Button>
              <Button variant="ghost" onClick={() => setVisible(false)} aria-label="Close invite popup">
                ✕
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function RewardsPage() {
  const { user } = useAuth();
  const {
    loyaltyPoints,
    badges,
    addPoints,
    addCoupon,
    recordSpin,
  } = useRewards();
  const { toast } = useToast();

  const [canSpin, setCanSpin] = useState(true);

  useEffect(() => {
    const lastSpin = localStorage.getItem("lastSpinDate");
    if (lastSpin && new Date(lastSpin).toDateString() === new Date().toDateString()) {
      setCanSpin(false);
    } else {
      setCanSpin(true);
    }
  }, []);

  const onSpinDenied = () => {
    toast({
      title: "Spin not available",
      description: "You can spin only once in a 24 hr period.",
      variant: "destructive",
    });
  };

  const onSpinResult = useCallback(
    (prize) => {
      recordSpin(new Date());
      if (prize.type === "coins") {
        addPoints(prize.value);
      } else if (prize.type === "coupon") {
        addCoupon({
          id: `spin-${Date.now()}`,
          value: prize.value,
          code: generateUniqueCode(),
          expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          used: false,
        });
      }
      let message = "";
      switch (prize.type) {
        case "coins":
          message = `You earned ${prize.value} coins!`;
          break;
        case "coupon":
          message = `You won a coupon of ₹${prize.value} off! Check your coupons.`;
          break;
        case "cashback":
          message = `You won ${prize.value}% cashback!`;
          break;
        case "shipping":
          message = `You won free shipping!`;
          break;
        default:
          message = `Better luck next time!`;
      }
      toast({ title: "Spin Result", description: message, variant: "success" });
      setCanSpin(false);
      localStorage.setItem("lastSpinDate", new Date().toISOString());
    },
    [addPoints, addCoupon, recordSpin, toast]
  );

  if (!user) {
    return (
      <div className="container mx-auto py-20 text-center text-lg dark:text-white">
        Please log in to view rewards.
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto p-8 max-w-2xl space-y-10">
        <LoyaltyAndBadges
          loyaltyPoints={loyaltyPoints}
          badges={badges}
          onPointsChanged={addPoints}
        />
        <SpinWheel
          canSpin={canSpin}
          onSpinResult={onSpinResult}
          onSpinDenied={onSpinDenied}
        />
        <ReferralPopup user={user} />
      </main>

      {/* Add CSS styles for responsiveness */}
      <style jsx>{`
        /* Container for spin wheel */
        .spin-wheel-container {
          width: ${SPIN_SIZE}px;
          height: ${SPIN_SIZE}px;
          margin: 0 auto;
          position: relative;
        }
        /* Spin pointer arrow */
        .spin-pointer {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 3.5rem;
          pointer-events: none;
          user-select: none;
          color: #7c3aed;
        }
        /* Responsive adjustments */
        @media (max-width: 480px) {
          .spin-wheel-container {
            width: 240px;
            height: 240px;
          }
          .spin-pointer {
            top: -30px;
            font-size: 2.5rem;
          }
          .daily-spin-heading {
            font-size: 1.75rem;
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </>
  );
}
