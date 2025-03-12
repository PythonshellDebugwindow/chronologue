import { Dispatch, SetStateAction } from 'react';
import ReactSelect from 'react-select';

import { CSelect } from './CForm';

import { IPartOfSpeech, IWordClass } from '../wordData';

interface IPOSAndClassesSelect {
  pos: string;
  setPos: Dispatch<SetStateAction<string>>;
  allLangPos: IPartOfSpeech[];
  classes: IWordClass[];
  setClasses: Dispatch<SetStateAction<IWordClass[]>>;
  allLangClasses: IWordClass[];
}

export default function POSAndClassesSelect(
  { pos, setPos, allLangPos, classes, setClasses, allLangClasses } : IPOSAndClassesSelect
) {
  const posAbbr = <abbr title="part of speech">POS</abbr>;
  
  const posClasses = allLangClasses.filter(cls => cls.pos === pos);
  const classesValue = classes.map(
    cls => ({ value: cls, label: `[${cls.code}] ${cls.name}` })
  ).sort((c1, c2) => c1.label.localeCompare(c2.label));

  return (
    <>
      <CSelect
        label={posAbbr}
        name="pos"
        state={pos}
        setState={ pos => { setClasses([]); setPos(pos); } }
      >
        <option value="">---</option>
        {
          allLangPos.map(
            pos => <option value={ pos.code } key={ pos.code }>{ pos.name }</option>
          )
        }
      </CSelect>
      {
        posClasses.length > 0 && <tr>
          <td>
            <label htmlFor="rs-classes">Classes:</label>
          </td>
          <td>
            <ReactSelect
              inputId="rs-classes"
              isMulti
              value={classesValue}
              options={
                posClasses.map(
                  cls => ({ value: cls, label: `[${cls.code}] ${cls.name}` })
                )
              }
              isClearable={false}
              components={{
                IndicatorSeparator: () => null
              }}
              styles={{
                control: styles => ({ ...styles, minHeight: "unset", maxWidth: "15em", borderColor: "#767676" }),
                dropdownIndicator: styles => ({ ...styles, padding: "0" }),
                input: styles => ({
                  ...styles, margin: "0", paddingBottom: "0", paddingTop: "0"
                }),
                menu: styles => ({ ...styles, top: "auto", bottom: "100%", width: "12em" }),
                multiValueLabel: styles => ({ ...styles, padding: "0", paddingLeft: "3px", paddingRight: "2px" }),
                multiValueRemove: styles => ({ ...styles, paddingLeft: "3px", paddingRight: "3px"}),
                noOptionsMessage: styles => ({ ...styles, paddingTop: "1px", paddingBottom: "1px" }),
                option: styles => ({ ...styles, fontSize: "0.8rem", padding: "5px" }),
                placeholder: styles => ({ ...styles, fontSize: "0.9em"}),
                valueContainer: styles => ({ ...styles, padding: "2px" })
              }}
              onChange={ e => setClasses(e.map(option => option.value)) }
            />
          </td>
        </tr>
      }
    </>
  );
};
