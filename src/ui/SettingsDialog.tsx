import * as Dialog from "@radix-ui/react-dialog";
import * as Slider from "@radix-ui/react-slider";
import * as Switch from "@radix-ui/react-switch";
import { useGameStore } from "../runtime/store";
import { COLOR, TYPE } from "../theme/tokens";

interface RowProps {
  label: string;
  description?: string;
  control: React.ReactNode;
}

function SettingRow({ label, description, control }: RowProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        padding: "12px 0",
        borderBottom: `1px solid ${COLOR.borderMute}`,
      }}
    >
      <div>
        <div style={{ color: COLOR.cream, fontFamily: TYPE.faceMono, fontSize: 14 }}>{label}</div>
        {description ? (
          <div style={{ color: COLOR.creamDim, fontFamily: TYPE.faceMono, fontSize: 11 }}>
            {description}
          </div>
        ) : null}
      </div>
      <div>{control}</div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onChange}
      aria-label={ariaLabel}
      style={{
        width: 44,
        height: 24,
        background: checked ? COLOR.sodium : "transparent",
        border: `1px solid ${COLOR.sodium}`,
        borderRadius: 12,
        position: "relative",
        cursor: "pointer",
        // Keep the touch target ≥ 44 px even though the visible track
        // is 24 px tall — pad the hit area in the parent flex row.
      }}
    >
      <Switch.Thumb
        style={{
          display: "block",
          width: 18,
          height: 18,
          background: checked ? COLOR.bgAsphalt : COLOR.sodium,
          borderRadius: "50%",
          transform: checked ? "translateX(22px)" : "translateX(2px)",
          transition: "transform 120ms ease",
          marginTop: 2,
        }}
      />
    </Switch.Root>
  );
}

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const settings = useGameStore((s) => s.settings);
  const setMasterVolumeDb = useGameStore((s) => s.setMasterVolumeDb);
  const setMuted = useGameStore((s) => s.setMuted);
  const setReducedMotion = useGameStore((s) => s.setReducedMotion);
  const setHighContrast = useGameStore((s) => s.setHighContrast);
  const setCrtOverlay = useGameStore((s) => s.setCrtOverlay);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(13, 12, 10, 0.78)",
            zIndex: 50,
          }}
        />
        <Dialog.Content
          aria-describedby={undefined}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(90vw, 420px)",
            background: COLOR.bgConcreteDark,
            color: COLOR.cream,
            border: `1px solid ${COLOR.sodium}`,
            padding: "20px 24px",
            fontFamily: TYPE.faceDisplay,
            zIndex: 51,
          }}
        >
          <Dialog.Title
            style={{
              color: COLOR.sodium,
              margin: 0,
              marginBottom: 4,
              fontSize: 22,
              letterSpacing: 2,
            }}
          >
            SETTINGS
          </Dialog.Title>

          <SettingRow
            label="Master Volume"
            description={`${settings.masterVolumeDb.toFixed(0)} dB`}
            control={
              <Slider.Root
                value={[settings.masterVolumeDb]}
                onValueChange={([v]) => v !== undefined && setMasterVolumeDb(v)}
                min={-60}
                max={0}
                step={1}
                aria-label="Master volume"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  width: 140,
                  height: 24,
                }}
              >
                <Slider.Track
                  style={{
                    background: COLOR.borderMute,
                    position: "relative",
                    flexGrow: 1,
                    height: 2,
                  }}
                >
                  <Slider.Range
                    style={{ position: "absolute", background: COLOR.sodium, height: 2 }}
                  />
                </Slider.Track>
                <Slider.Thumb
                  aria-label="Master volume"
                  style={{
                    display: "block",
                    width: 14,
                    height: 14,
                    background: COLOR.sodium,
                    borderRadius: "50%",
                    cursor: "pointer",
                  }}
                />
              </Slider.Root>
            }
          />

          <SettingRow
            label="Mute"
            control={
              <ToggleSwitch checked={settings.muted} onChange={setMuted} ariaLabel="Mute audio" />
            }
          />
          <SettingRow
            label="Reduce Motion"
            description="Snap animations and short-circuit pulses."
            control={
              <ToggleSwitch
                checked={settings.reducedMotion}
                onChange={setReducedMotion}
                ariaLabel="Reduce motion"
              />
            }
          />
          <SettingRow
            label="High Contrast"
            description="Bumps text/backdrop ratio toward AAA."
            control={
              <ToggleSwitch
                checked={settings.highContrast}
                onChange={setHighContrast}
                ariaLabel="High contrast mode"
              />
            }
          />
          <SettingRow
            label="CRT Overlay"
            description="Optional scanlines + chroma fringe."
            control={
              <ToggleSwitch
                checked={settings.crtOverlay}
                onChange={setCrtOverlay}
                ariaLabel="CRT overlay"
              />
            }
          />

          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <Dialog.Close asChild>
              <button
                type="button"
                style={{
                  background: COLOR.sodium,
                  color: COLOR.bgAsphalt,
                  border: "none",
                  minWidth: 88,
                  minHeight: 44,
                  padding: "10px 18px",
                  fontFamily: TYPE.faceDisplay,
                  letterSpacing: 1,
                  cursor: "pointer",
                }}
              >
                CLOSE
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
