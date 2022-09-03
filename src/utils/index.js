
export const countFrequency = (arr, n) => {
    let counterList = []
    let userList = []
    var mp = new Map();
  
    // Traverse through array elements and
    // count frequencies
    for (var i = 0; i < n; i++)
    {
        if(mp.has(arr[i]))
            mp.set(arr[i], mp.get(arr[i])+1)
        else
            mp.set(arr[i], 1)
    }
  
    var keys = [];
    mp.forEach((value, key) => {
        keys.push(key);
    });
    keys.sort((a,b)=> a-b);
      
    // Traverse through map and print frequencies
    keys.forEach((key) => {
        userList.push(key);
        counterList.push(mp.get(key))
    });
    return {
        userList,
        counterList
    }
}
