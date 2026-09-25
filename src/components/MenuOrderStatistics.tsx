import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  EnumNotificationType,
  EnumOrderStatus,
  type INotification,
  type IOrderEntity,
} from "chopme-frontend-common";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import { BarChart3, RefreshCcw } from "lucide-react";
import { MenuService } from "../services/menu.service";
import type { RootState } from "../store";

type PeriodOption = "today" | "last7Days" | "lastMonth" | "lastYear";

type MenuStat = {
  menuId: string;
  menuName: string;
  totalOrders: number;
};

const CHART_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#14b8a6",
];

const getDateRangeForPeriod = (period: PeriodOption) => {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "last7Days":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "lastMonth":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "lastYear":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

const MenuOrderStatistics = () => {
  const { t } = useTranslation();
  const { newNotification } = useSelector(
    (state: RootState) => state.notification,
  );

  const [period, setPeriod] = useState<PeriodOption>("lastMonth");
  const [stats, setStats] = useState<MenuStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRangeForPeriod(period);
      const res = await MenuService.getOrderStats({ startDate, endDate });
      setStats(res.data.data ?? []);
    } catch {
      // Silently ignore statistics fetch failures
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const notification = newNotification as INotification<IOrderEntity>;

    if (
      !notification ||
      notification.type !== EnumNotificationType.ORDER_STATUS_CHANGED ||
      notification.data.status !== EnumOrderStatus.PAID
    )
      return;

    setStats((prev) => {
      let hasMatch = false;
      const next = prev.map((stat) => {
        const item = notification.data.items.find(
          (orderItem) => orderItem.productId === stat.menuId,
        );
        if (!item) return stat;
        hasMatch = true;
        return {
          ...stat,
          totalOrders: stat.totalOrders + item.quantity,
        };
      });
      return hasMatch ? next : prev;
    });
  }, [newNotification]);

  const handlePeriodChange = (event: SelectChangeEvent) => {
    setPeriod(event.target.value as PeriodOption);
  };

  const hasOrders = stats.some((stat) => stat.totalOrders > 0);

  return (
    <div className="space-y-4 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-lg font-bold text-text">
          {t("home.menuStatistics")}
        </h2>
        <div className="flex items-center gap-2">
          <FormControl
            size="small"
            className="flex-1 sm:flex-none sm:min-w-[180px]"
          >
            <InputLabel id="menu-stats-period-label">
              {t("home.period")}
            </InputLabel>
            <Select
              labelId="menu-stats-period-label"
              label={t("home.period")}
              value={period}
              onChange={handlePeriodChange}
              sx={{
                borderRadius: "0.75rem",
                backgroundColor: "white",
              }}
            >
              <MenuItem value="today">{t("home.periodToday")}</MenuItem>
              <MenuItem value="last7Days">{t("home.periodLast7Days")}</MenuItem>
              <MenuItem value="lastMonth">{t("home.periodLastMonth")}</MenuItem>
              <MenuItem value="lastYear">{t("home.periodLastYear")}</MenuItem>
            </Select>
          </FormControl>
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="rounded-lg p-2 text-text/70 hover:bg-card hover:text-primary transition-colors disabled:opacity-60"
            aria-label="Refresh"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {!hasOrders && !loading ? (
        <div className="rounded-2xl bg-card p-8 shadow-sm flex flex-col items-center justify-center text-center gap-3">
          <div className="rounded-full bg-gray-100 p-4">
            <BarChart3 size={32} className="text-gray-400" />
          </div>
          <p className="text-base font-semibold text-text">
            {t("home.noMenuStatistics")}
          </p>
          <p className="text-sm text-gray-400 max-w-xs">
            {t("home.noMenuStatisticsDescription")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="w-full overflow-x-auto rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-text/70 mb-2">
              {t("home.ordersByMenu")}
            </p>
            <BarChart
              xAxis={[
                {
                  data: stats.map((stat) => stat.menuName),
                  scaleType: "band",
                },
              ]}
              series={[
                {
                  data: stats.map((stat) => stat.totalOrders),
                  label: t("home.totalOrders"),
                },
              ]}
              colors={CHART_COLORS}
              height={300}
              hideLegend
              borderRadius={8}
              grid={{ horizontal: true }}
              sx={{
                "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
                  stroke: "#e5e7eb",
                },
                "& .MuiChartsGrid-line": {
                  stroke: "#f1f5f9",
                },
              }}
            />
          </div>
          {stats.length > 1 && (
            <div className="w-full flex flex-col items-center rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-text/70 mb-2 self-start">
                {t("home.orderDistribution")}
              </p>
              <PieChart
                series={[
                  {
                    data: stats.map((stat) => ({
                      id: stat.menuId,
                      value: stat.totalOrders,
                      label: stat.menuName,
                    })),
                    innerRadius: 50,
                    paddingAngle: 3,
                    cornerRadius: 6,
                    arcLabel: (item) => `${item.value}`,
                    arcLabelMinAngle: 15,
                  },
                ]}
                colors={CHART_COLORS}
                height={300}
                slotProps={{
                  legend: {
                    direction: "horizontal",
                    position: { vertical: "bottom", horizontal: "center" },
                  },
                }}
                sx={{
                  "& .MuiPieArcLabel-root": {
                    fill: "white",
                    fontWeight: "bold",
                    fontSize: 12,
                  },
                  "& .MuiPieArc-root": {
                    stroke: "white",
                    strokeWidth: 2,
                  },
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MenuOrderStatistics;
