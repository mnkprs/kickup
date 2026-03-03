"use client";

import { useState, useEffect, type HTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { TournamentStandingsGroup } from "@/lib/types";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { removeTeamFromTournamentAction, moveTeamToGroupAction } from "@/app/actions/tournaments";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface TournamentStandingsProps {
  standingsGroups: TournamentStandingsGroup[];
  title?: string;
  /** When set, show remove button for each team (registration phase only) */
  canRemoveTeam?: boolean;
  /** When set, allow owner to move teams between groups */
  canDragDrop?: boolean;
  tournamentId?: string;
}

type StandingsRow = {
  rank: number;
  team_id: string;
  team: { short_name: string; name: string; avatar_url?: string | null; emoji?: string; color?: string };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
};

function getRawGroupLabel(groupLabel: string): string {
  return groupLabel.startsWith("Group ") ? groupLabel.slice(6) : groupLabel;
}

function StandingsRowContent({
  row,
  i,
  gridCols,
  canRemove,
  onRemove,
  showHandle,
  dragHandleProps,
}: {
  row: StandingsRow;
  i: number;
  gridCols: string;
  canRemove?: boolean;
  onRemove?: (teamId: string, teamName: string) => void;
  showHandle?: boolean;
  dragHandleProps?: HTMLAttributes<HTMLDivElement>;
}) {
  const gd = row.goals_for - row.goals_against;
  return (
    <>
      {showHandle && (
        <div
          {...dragHandleProps}
          className="flex items-center justify-center text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical size={14} strokeWidth={2} />
        </div>
      )}
      <span className={`text-xs font-medium ${i < 2 ? "text-accent" : "text-muted-foreground"}`}>
        {row.rank}
      </span>
      <Link
        href={`/teams/${row.team_id}`}
        className="flex items-center gap-1.5 min-w-0 overflow-hidden hover:opacity-80 transition-opacity"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <TeamAvatar
          avatar_url={row.team.avatar_url}
          emoji={row.team.emoji ?? "⚽"}
          short_name={row.team.short_name}
          name={row.team.name}
          color={row.team.color ?? "#2E7D32"}
          size="2xs"
        />
        <span className="text-xs truncate text-foreground font-medium">{row.team.name}</span>
      </Link>
      <span className="text-foreground text-xs text-center">{row.played}</span>
      <span className="text-foreground text-xs text-center">{row.won}</span>
      <span className="text-foreground text-xs text-center">{row.drawn}</span>
      <span className="text-foreground text-xs text-center">{row.lost}</span>
      <span className={`text-xs text-center font-medium ${gd > 0 ? "text-win" : gd < 0 ? "text-loss" : "text-muted-foreground"}`}>
        {gd > 0 ? `+${gd}` : gd}
      </span>
      <span className="text-foreground text-xs font-bold text-center">{row.points}</span>
      {canRemove && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(row.team_id, row.team.name);
          }}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-loss/15 hover:text-loss transition-colors pressable shrink-0"
          aria-label={`Remove ${row.team.name} from tournament`}
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      )}
    </>
  );
}

function DraggableTeamRow({
  row,
  i,
  gridCols,
  canRemove,
  onRemove,
  disabled,
}: {
  row: StandingsRow;
  i: number;
  gridCols: string;
  canRemove?: boolean;
  onRemove?: (teamId: string, teamName: string) => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: row.team_id,
    data: { teamId: row.team_id },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={`tournament-standings__row grid ${gridCols} gap-0.5 px-2 py-1.5 items-center min-h-[2rem] border-b border-border last:border-b-0 transition-colors ${
        isDragging ? "opacity-40" : "hover:bg-muted/30"
      }`}
    >
      <StandingsRowContent
        row={row}
        i={i}
        gridCols={gridCols}
        canRemove={canRemove}
        onRemove={onRemove}
        showHandle={!disabled}
        dragHandleProps={disabled ? undefined : { ...attributes, ...listeners }}
      />
    </div>
  );
}

function DroppableGroup({
  groupLabel,
  rawLabel,
  rows,
  gridCols,
  canRemove,
  tournamentId,
  onRemove,
  isNewGroup,
}: {
  groupLabel: string;
  rawLabel: string;
  rows: StandingsRow[];
  gridCols: string;
  canRemove?: boolean;
  tournamentId?: string;
  onRemove?: (teamId: string, teamName: string) => void;
  isNewGroup?: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: isNewGroup ? "__NEW__" : rawLabel,
  });

  return (
    <div
      ref={setNodeRef}
      className={isOver ? "ring-2 ring-accent/50 ring-inset rounded" : ""}
    >
      <div
        className={`px-3 py-2 border-b border-border ${isNewGroup ? "bg-accent/10" : "bg-muted/30"}`}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-foreground">
            {isNewGroup ? "+ New group" : groupLabel}
          </span>
          {isNewGroup && (
            <span className="text-[10px] text-muted-foreground">
              Drag a team here to create a new group
            </span>
          )}
        </div>
      </div>
      {rows.length > 0 && (
        <>
          <div className={`tournament-standings__header-row grid ${gridCols} gap-0.5 px-2 py-1.5 items-center min-h-[2rem] border-b border-border`}>
            {!isNewGroup && <span className="w-5 shrink-0" />}
            <span className="text-muted-foreground text-[10px] font-medium">#</span>
            <span className="text-muted-foreground text-[10px] font-medium">Team</span>
            <span className="text-muted-foreground text-xs font-medium text-center">P</span>
            <span className="text-muted-foreground text-xs font-medium text-center">W</span>
            <span className="text-muted-foreground text-xs font-medium text-center">D</span>
            <span className="text-muted-foreground text-xs font-medium text-center">L</span>
            <span className="text-muted-foreground text-xs font-medium text-center">GD</span>
            <span className="text-muted-foreground text-xs font-medium text-center">PTS</span>
            {(canRemove || isNewGroup) && <span className="w-8 shrink-0" />}
          </div>
          {rows.map((row, i) => (
            <DraggableTeamRow
              key={row.team_id}
              row={row}
              i={i + 1}
              gridCols={gridCols}
              canRemove={canRemove}
              onRemove={onRemove}
              disabled={isNewGroup}
            />
          ))}
        </>
      )}
    </div>
  );
}

function StandingsTable({
  rows,
  canRemove,
  tournamentId,
  onRemove,
}: {
  rows: StandingsRow[];
  canRemove?: boolean;
  tournamentId?: string;
  onRemove?: (teamId: string, teamName: string) => void;
}) {
  const gridCols = canRemove
    ? "grid-cols-[1.5rem_minmax(0,1fr)_1.25rem_1.25rem_1.25rem_1.25rem_1.75rem_1.75rem_2rem]"
    : "grid-cols-[1.5rem_minmax(0,1fr)_1.25rem_1.25rem_1.25rem_1.25rem_1.75rem_1.75rem]";

  return (
    <>
      <div className={`tournament-standings__header-row grid ${gridCols} gap-0.5 px-2 py-1.5 items-center min-h-[2rem] border-b border-border`}>
        <span className="text-muted-foreground text-[10px] font-medium">#</span>
        <span className="text-muted-foreground text-[10px] font-medium">Team</span>
        <span className="text-muted-foreground text-xs font-medium text-center">P</span>
        <span className="text-muted-foreground text-xs font-medium text-center">W</span>
        <span className="text-muted-foreground text-xs font-medium text-center">D</span>
        <span className="text-muted-foreground text-xs font-medium text-center">L</span>
        <span className="text-muted-foreground text-xs font-medium text-center">GD</span>
        <span className="text-muted-foreground text-xs font-medium text-center">PTS</span>
        {canRemove && <span className="w-8" />}
      </div>
      {rows.map((row, i) => {
        const gd = row.goals_for - row.goals_against;
        return (
          <div
            key={row.team_id}
            className={`tournament-standings__row grid ${gridCols} gap-0.5 px-2 py-1.5 items-center min-h-[2rem] border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors`}
          >
            <StandingsRowContent row={row} i={i + 1} gridCols={gridCols} canRemove={canRemove} onRemove={onRemove} />
          </div>
        );
      })}
    </>
  );
}

const gridColsWithHandle =
  "grid-cols-[1.25rem_1.5rem_minmax(0,1fr)_1.25rem_1.25rem_1.25rem_1.25rem_1.75rem_1.75rem_2rem]";

export function TournamentStandings({
  standingsGroups,
  title = "Standings",
  canRemoveTeam = false,
  canDragDrop = false,
  tournamentId,
}: TournamentStandingsProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ teamId: string; teamName: string } | null>(null);
  const [activeTeam, setActiveTeam] = useState<StandingsRow | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const hasGroups = standingsGroups.some((g) => g.groupLabel && g.groupLabel.startsWith("Group "));
  const canMove = canDragDrop && hasGroups && tournamentId;

  // Prevent page scroll during drag
  useEffect(() => {
    if (!isDragging) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [isDragging]);

  async function handleRemove(teamId: string, teamName: string) {
    if (!tournamentId) return;
    setRemovingId(teamId);
    const result = await removeTeamFromTournamentAction(tournamentId, teamId);
    setRemovingId(null);
    setConfirmRemove(null);
    if (result.error) return;
    router.refresh();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTeam(null);
    setIsDragging(false);

    if (!over || !tournamentId || !canMove) return;

    const teamId = active.id as string;
    const targetGroup = over.id as string;

    const result = await moveTeamToGroupAction(tournamentId, teamId, targetGroup);
    if (result.error) return;
    router.refresh();
  }

  function handleDragStart(event: DragStartEvent) {
    setIsDragging(true);
    const teamId = event.active.id as string;
    for (const g of standingsGroups) {
      const row = g.standings.find((s) => s.team_id === teamId);
      if (row) {
        setActiveTeam({
          rank: row.rank,
          team_id: row.team_id,
          team: row.team,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goals_for: row.goals_for,
          goals_against: row.goals_against,
          points: row.points,
        });
        break;
      }
    }
  }

  const hasAny = standingsGroups.some((g) => g.standings.length > 0);

  const content = (
    <>
      {standingsGroups.map((group) => {
        const rawLabel = getRawGroupLabel(group.groupLabel || "");
        const isFlatList = !group.groupLabel;
        if (isFlatList) {
          return (
            <div key="all">
              <StandingsTable
                rows={group.standings as StandingsRow[]}
                canRemove={canRemoveTeam}
                tournamentId={tournamentId}
                onRemove={canRemoveTeam ? (id, name) => setConfirmRemove({ teamId: id, teamName: name }) : undefined}
              />
            </div>
          );
        }
        if (canMove) {
          return (
            <DroppableGroup
              key={group.groupLabel}
              groupLabel={group.groupLabel}
              rawLabel={rawLabel}
              rows={group.standings as StandingsRow[]}
              gridCols={gridColsWithHandle}
              canRemove={canRemoveTeam}
              tournamentId={tournamentId}
              onRemove={canRemoveTeam ? (id, name) => setConfirmRemove({ teamId: id, teamName: name }) : undefined}
              isNewGroup={false}
            />
          );
        }
        return (
          <div key={group.groupLabel}>
            <div className="px-3 py-2 bg-muted/30 border-b border-border">
              <span className="text-xs font-semibold text-foreground">{group.groupLabel}</span>
            </div>
            <StandingsTable
              rows={group.standings as StandingsRow[]}
              canRemove={canRemoveTeam}
              tournamentId={tournamentId}
              onRemove={canRemoveTeam ? (id, name) => setConfirmRemove({ teamId: id, teamName: name }) : undefined}
            />
          </div>
        );
      })}
      {canMove && hasGroups && (
        <DroppableGroup
          groupLabel=""
          rawLabel=""
          rows={[]}
          gridCols={gridColsWithHandle}
          isNewGroup
        />
      )}
    </>
  );

  return (
    <section className="tournament-standings px-5">
      <div className="tournament-standings__header flex items-center justify-between mb-3">
        <h2 className="tournament-standings__title text-foreground font-semibold text-base">{title}</h2>
        {canMove && (
          <span className="text-xs text-muted-foreground">Drag teams between groups</span>
        )}
      </div>
      <div className="rounded-lg bg-card border border-border shadow-card overflow-hidden">
        {!hasAny ? (
          <div className="px-3 py-6 text-center">
            <p className="text-muted-foreground text-sm">No teams enrolled yet</p>
          </div>
        ) : canMove ? (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {content}
            <DragOverlay dropAnimation={null}>
              {activeTeam ? (
                <div
                  className={`tournament-standings__row grid ${gridColsWithHandle} gap-0.5 px-2 py-1.5 items-center min-h-[2rem] border border-accent/50 rounded-lg bg-card shadow-lg`}
                  style={{ touchAction: "none" }}
                >
                  <StandingsRowContent
                    row={activeTeam}
                    i={activeTeam.rank}
                    gridCols={gridColsWithHandle}
                    showHandle
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          content
        )}
        <ConfirmModal
          open={!!confirmRemove}
          onClose={() => setConfirmRemove(null)}
          onConfirm={async () => {
            if (confirmRemove) await handleRemove(confirmRemove.teamId, confirmRemove.teamName);
          }}
          title="Remove team from tournament?"
          message={
            confirmRemove
              ? `${confirmRemove.teamName} will be removed. They can register again before registration closes.`
              : ""
          }
          buttons={{ confirmLabel: "Remove", variant: "destructive" }}
          loading={removingId !== null}
        />
      </div>
    </section>
  );
}
