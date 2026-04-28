import * as Accordion from "@radix-ui/react-accordion";
import * as Dialog from "@radix-ui/react-dialog";
import * as Slider from "@radix-ui/react-slider";
import * as Switch from "@radix-ui/react-switch";
import { useState } from "react";
import { useGameStore } from "../runtime/store";
import { COLOR, TYPE } from "../theme/tokens";

interface RowProps {
  id: string;
  label: string;
  description?: string;
  control: React.ReactNode | ((descriptionId: string | undefined) => React.ReactNode);
  /** Optional live-preview chip rendered to the right of the description. */
  preview?: React.ReactNode;
}

function SettingRow({ id, label, description, control, preview }: RowProps) {
  const descId = description ? `${id}-desc` : undefined;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        padding: "10px 0",
        borderBottom: `1px solid ${COLOR.borderMute}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: COLOR.cream, fontFamily: TYPE.faceMono, fontSize: 13 }}>{label}</div>
        {description ? (
          <div
            id={descId}
            style={{
              color: COLOR.creamDim,
              fontFamily: TYPE.faceMono,
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span>{description}</span>
            {preview}
          </div>
        ) : null}
      </div>
      <div>{typeof control === "function" ? control(descId) : control}</div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
  ariaDescribedBy,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
  ariaDescribedBy?: string | undefined;
}) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onChange}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      style={{
        width: 44,
        height: 24,
        background: checked ? COLOR.sodium : "transparent",
        border: `1px solid ${COLOR.sodium}`,
        borderRadius: 12,
        position: "relative",
        cursor: "pointer",
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

function DbSlider({
  value,
  onChange,
  ariaLabel,
  ariaDescribedBy,
  min = -60,
  max = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  ariaLabel: string;
  ariaDescribedBy?: string | undefined;
  min?: number;
  max?: number;
}) {
  return (
    <Slider.Root
      value={[value]}
      onValueChange={([v]) => v !== undefined && onChange(v)}
      min={min}
      max={max}
      step={1}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: 140,
        height: 24,
      }}
    >
      <Slider.Track style={{ background: COLOR.borderMute, position: "relative", flexGrow: 1, height: 2 }}>
        <Slider.Range style={{ position: "absolute", background: COLOR.sodium, height: 2 }} />
      </Slider.Track>
      <Slider.Thumb
        aria-label={ariaLabel}
        style={{ display: "block", width: 14, height: 14, background: COLOR.sodium, borderRadius: "50%", cursor: "pointer" }}
      />
    </Slider.Root>
  );
}

/** Live preview pip — fills 0..1 of a small bar based on the dB value. */
function VolumePreview({ db }: { db: number }) {
  const norm = Math.max(0, Math.min(1, (db + 60) / 60));
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 36,
        height: 4,
        background: COLOR.borderMute,
        position: "relative",
        verticalAlign: "middle",
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          width: `${norm * 100}%`,
          background: COLOR.sodium,
        }}
      />
    </span>
  );
}

function MotionPreview({ reduced }: { reduced: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 32,
        height: 8,
        background: COLOR.borderMute,
        position: "relative",
        overflow: "hidden",
        verticalAlign: "middle",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 1,
          left: 1,
          width: 6,
          height: 6,
          background: COLOR.sodium,
          animation: reduced ? undefined : "cv-settings-motion-preview 1.2s ease-in-out infinite",
        }}
      />
    </span>
  );
}

interface CategoryProps {
  value: string;
  title: string;
  caption: string;
  children: React.ReactNode;
}

function Category({ value, title, caption, children }: CategoryProps) {
  return (
    <Accordion.Item
      value={value}
      style={{
        borderBottom: `1px solid ${COLOR.borderMute}`,
      }}
    >
      <Accordion.Header asChild>
        <h3 style={{ margin: 0 }}>
          <Accordion.Trigger
            style={{
              all: "unset",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "14px 4px",
              cursor: "pointer",
              color: COLOR.sodium,
              fontFamily: TYPE.faceMono,
              fontSize: 12,
              letterSpacing: "0.22em",
            }}
          >
            <span>
              {title}
              <span style={{ marginLeft: 10, color: COLOR.creamDim, letterSpacing: "0.1em", fontSize: 10 }}>
                {caption}
              </span>
            </span>
            <span aria-hidden="true" className="cv-settings-chevron" style={{ fontSize: 14 }}>
              ▸
            </span>
          </Accordion.Trigger>
        </h3>
      </Accordion.Header>
      <Accordion.Content
        style={{
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "0 4px 14px" }}>{children}</div>
      </Accordion.Content>
    </Accordion.Item>
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
  const setMusicVolumeDb = useGameStore((s) => s.setMusicVolumeDb);
  const setSfxVolumeDb = useGameStore((s) => s.setSfxVolumeDb);
  const setUiVolumeDb = useGameStore((s) => s.setUiVolumeDb);
  const setMuted = useGameStore((s) => s.setMuted);
  const setReducedMotion = useGameStore((s) => s.setReducedMotion);
  const setHighContrast = useGameStore((s) => s.setHighContrast);
  const setCrtOverlay = useGameStore((s) => s.setCrtOverlay);
  const setHaptics = useGameStore((s) => s.setHaptics);
  const setAimAssist = useGameStore((s) => s.setAimAssist);
  const setInvertY = useGameStore((s) => s.setInvertY);

  // Open the Audio panel by default — most-tweaked category in playtests.
  const [openCats, setOpenCats] = useState<string[]>(["audio"]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{ position: "fixed", inset: 0, background: "rgba(13, 12, 10, 0.78)", zIndex: 50 }}
        />
        <Dialog.Content
          aria-describedby={undefined}
          data-testid="settings-dialog"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(92vw, 460px)",
            maxHeight: "85vh",
            overflowY: "auto",
            background: COLOR.bgConcreteDark,
            color: COLOR.cream,
            border: `1px solid ${COLOR.sodium}`,
            padding: "20px 22px",
            fontFamily: TYPE.faceDisplay,
            zIndex: 51,
          }}
        >
          <Dialog.Title
            style={{
              color: COLOR.sodium,
              margin: 0,
              marginBottom: 4,
              fontSize: 20,
              letterSpacing: 2,
            }}
          >
            SETTINGS
          </Dialog.Title>
          <p
            style={{
              color: COLOR.creamDim,
              fontFamily: TYPE.faceMono,
              fontSize: 11,
              margin: "0 0 12px",
              letterSpacing: "0.1em",
            }}
          >
            TUNE THE CABINET
          </p>

          <Accordion.Root
            type="multiple"
            value={openCats}
            onValueChange={setOpenCats}
            style={{ borderTop: `1px solid ${COLOR.borderMute}` }}
          >
            <Category value="audio" title="AUDIO" caption="MIX">
              <SettingRow
                id="setting-master-volume"
                label="Master"
                description={`${settings.masterVolumeDb.toFixed(0)} dB`}
                preview={<VolumePreview db={settings.masterVolumeDb} />}
                control={(descId) => (
                  <DbSlider
                    value={settings.masterVolumeDb}
                    onChange={setMasterVolumeDb}
                    ariaLabel="Master volume"
                    ariaDescribedBy={descId}
                  />
                )}
              />
              <SettingRow
                id="setting-music-volume"
                label="Music"
                description={`${settings.musicVolumeDb.toFixed(0)} dB`}
                preview={<VolumePreview db={settings.musicVolumeDb} />}
                control={(descId) => (
                  <DbSlider
                    value={settings.musicVolumeDb}
                    onChange={setMusicVolumeDb}
                    ariaLabel="Music volume"
                    ariaDescribedBy={descId}
                  />
                )}
              />
              <SettingRow
                id="setting-sfx-volume"
                label="SFX"
                description={`${settings.sfxVolumeDb.toFixed(0)} dB`}
                preview={<VolumePreview db={settings.sfxVolumeDb} />}
                control={(descId) => (
                  <DbSlider
                    value={settings.sfxVolumeDb}
                    onChange={setSfxVolumeDb}
                    ariaLabel="SFX volume"
                    ariaDescribedBy={descId}
                  />
                )}
              />
              <SettingRow
                id="setting-ui-volume"
                label="UI"
                description={`${settings.uiVolumeDb.toFixed(0)} dB`}
                preview={<VolumePreview db={settings.uiVolumeDb} />}
                control={(descId) => (
                  <DbSlider
                    value={settings.uiVolumeDb}
                    onChange={setUiVolumeDb}
                    ariaLabel="UI volume"
                    ariaDescribedBy={descId}
                  />
                )}
              />
              <SettingRow
                id="setting-mute"
                label="Mute"
                description="Silence everything immediately."
                control={(descId) => (
                  <ToggleSwitch
                    checked={settings.muted}
                    onChange={setMuted}
                    ariaLabel="Mute audio"
                    ariaDescribedBy={descId}
                  />
                )}
              />
            </Category>

            <Category value="visual" title="VISUAL" caption="LOOK">
              <SettingRow
                id="setting-crt-overlay"
                label="CRT Overlay"
                description="Optional scanlines + chroma fringe."
                control={(descId) => (
                  <ToggleSwitch
                    checked={settings.crtOverlay}
                    onChange={setCrtOverlay}
                    ariaLabel="CRT overlay"
                    ariaDescribedBy={descId}
                  />
                )}
              />
              <SettingRow
                id="setting-high-contrast"
                label="High Contrast"
                description="Bumps text/backdrop ratio toward AAA."
                control={(descId) => (
                  <ToggleSwitch
                    checked={settings.highContrast}
                    onChange={setHighContrast}
                    ariaLabel="High contrast mode"
                    ariaDescribedBy={descId}
                  />
                )}
              />
            </Category>

            <Category value="input" title="INPUT" caption="FEEL">
              <SettingRow
                id="setting-aim-assist"
                label="Aim Assist"
                description="Snap reticle to nearest vermin within a small radius."
                control={(descId) => (
                  <ToggleSwitch
                    checked={settings.aimAssist}
                    onChange={setAimAssist}
                    ariaLabel="Aim assist"
                    ariaDescribedBy={descId}
                  />
                )}
              />
              <SettingRow
                id="setting-invert-y"
                label="Invert Y (Gamepad)"
                description="Flip vertical aim on the right stick."
                control={(descId) => (
                  <ToggleSwitch
                    checked={settings.invertY}
                    onChange={setInvertY}
                    ariaLabel="Invert Y axis on gamepad"
                    ariaDescribedBy={descId}
                  />
                )}
              />
              <SettingRow
                id="setting-haptics"
                label="Haptics"
                description="Vibration on hit, kill, and boss damage. Mobile only."
                control={(descId) => (
                  <ToggleSwitch
                    checked={settings.haptics}
                    onChange={setHaptics}
                    ariaLabel="Haptics (vibration)"
                    ariaDescribedBy={descId}
                  />
                )}
              />
            </Category>

            <Category value="a11y" title="ACCESSIBILITY" caption="EVERY PLAYER">
              <SettingRow
                id="setting-reduce-motion"
                label="Reduce Motion"
                description="Snap animations and short-circuit pulses."
                preview={<MotionPreview reduced={settings.reducedMotion} />}
                control={(descId) => (
                  <ToggleSwitch
                    checked={settings.reducedMotion}
                    onChange={setReducedMotion}
                    ariaLabel="Reduce motion"
                    ariaDescribedBy={descId}
                  />
                )}
              />
            </Category>
          </Accordion.Root>

          <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
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

          <style>{`
            @keyframes cv-settings-motion-preview {
              0% { transform: translateX(0); }
              50% { transform: translateX(20px); }
              100% { transform: translateX(0); }
            }
            [data-state="open"] > h3 .cv-settings-chevron { transform: rotate(90deg); transition: transform 160ms ease; }
            [data-state="closed"] > h3 .cv-settings-chevron { transform: rotate(0); transition: transform 160ms ease; }
          `}</style>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
